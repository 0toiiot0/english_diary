import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type { Level } from '@/types/review';
import { submitReviewSchema, type SubmitReviewInput } from '@/lib/review-schema';
import { buildSystemPrompt, buildUserMessage } from '@/lib/prompt';

// 모델 ID는 M0에서 Anthropic Console/문서로 재확인 후 고정한다 (PRD 5.2, 11.2-①).
// 현재 기본값: Haiku 계열 최신 모델.
export const MODEL_ID = 'claude-haiku-4-5-20251001';

const MAX_TOKENS = 2048;
const TEMPERATURE = 0.3;

const SUBMIT_REVIEW_TOOL: Anthropic.Tool = {
  name: 'submit_review',
  description: '영어 일기 첨삭 결과를 제출한다.',
  input_schema: {
    type: 'object',
    properties: {
      corrections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            original: {
              type: 'string',
              description: '원문에서 그대로 복사한, 고쳐야 할 최소 구간',
            },
            corrected: { type: 'string', description: '고친 결과' },
            type: {
              type: 'string',
              enum: ['spelling', 'grammar', 'natural', 'punctuation'],
            },
            explanation: {
              type: 'string',
              description: '왜 틀렸는지에 대한 한국어 설명 1~2문장',
            },
            severity: {
              type: 'integer',
              minimum: 1,
              maximum: 3,
              description: '1=사소 3=중요',
            },
            contextBefore: {
              type: 'string',
              description: 'original 바로 앞 10~20자 (위치 특정용)',
            },
          },
          required: [
            'original',
            'corrected',
            'type',
            'explanation',
            'severity',
            'contextBefore',
          ],
        },
      },
      expressions: {
        type: 'array',
        minItems: 3,
        maxItems: 5,
        items: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: '추천하는 영어 관용구 또는 표현',
            },
            meaningKo: { type: 'string', description: '한국어 뜻' },
            kind: { type: 'string', enum: ['idiom', 'phrase'] },
            register: { type: 'string', enum: ['casual', 'neutral', 'formal'] },
            sourceSentence: {
              type: 'string',
              description: '이 표현과 연결되는 일기 속 원문 문장 (그대로 복사)',
            },
            rewritten: {
              type: 'string',
              description: 'sourceSentence를 이 표현으로 바꿔 쓴 문장',
            },
          },
          required: [
            'expression',
            'meaningKo',
            'kind',
            'register',
            'sourceSentence',
            'rewritten',
          ],
        },
      },
      praise: {
        type: 'string',
        description: '잘 쓴 문장 1개를 짚어 칭찬하는 한국어 한 문장',
      },
    },
    required: ['corrections', 'expressions', 'praise'],
  },
};

export class MissingApiKeyError extends Error {}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // 서버 시작 시가 아니라 첫 요청 시점에 걸린다 — 이 프로젝트는 별도 startup 훅이 없으므로
    // 여기서 검증하고, route handler가 AUTH로 정규화해 사용자에게 보여준다.
    throw new MissingApiKeyError('ANTHROPIC_API_KEY is not set');
  }
  client = new Anthropic({ apiKey });
  return client;
}

async function callModel(text: string, level: Level, signal?: AbortSignal): Promise<unknown> {
  const anthropic = getClient();
  const message = await anthropic.messages.create(
    {
      model: MODEL_ID,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system: buildSystemPrompt(level),
      messages: [{ role: 'user', content: buildUserMessage(text) }],
      tools: [SUBMIT_REVIEW_TOOL],
      tool_choice: { type: 'tool', name: 'submit_review' },
    },
    { signal }
  );

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
  );
  if (!toolUse) {
    throw new SchemaError('model did not return a tool_use block');
  }
  return toolUse.input;
}

export class SchemaError extends Error {}

/**
 * 일기 본문을 첨삭한다. 서버 전용 — 클라이언트 컴포넌트에서 import하면
 * 'server-only'에 의해 빌드 타임 에러가 난다.
 * 스키마 검증 실패 시 1회 자동 재시도 후에도 실패하면 SchemaError를 던진다 (ER-14).
 */
export async function reviewDiary(
  text: string,
  level: Level,
  signal?: AbortSignal
): Promise<{ result: SubmitReviewInput; model: string }> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callModel(text, level, signal);
      const parsed = submitReviewSchema.safeParse(raw);
      if (parsed.success) {
        return { result: parsed.data, model: MODEL_ID };
      }
      lastError = new SchemaError(parsed.error.message);
    } catch (err) {
      lastError = err;
      // 스키마 실패(ER-14)만 재시도한다. 키 누락·네트워크·인증 오류는 재시도해도
      // 같은 결과이므로 즉시 중단한다.
      if (!(err instanceof SchemaError)) break;
    }
  }

  if (lastError instanceof SchemaError) throw lastError;
  throw lastError instanceof Error ? lastError : new Error('unknown claude error');
}
