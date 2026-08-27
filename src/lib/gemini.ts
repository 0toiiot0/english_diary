import 'server-only';
import { GoogleGenAI, Type, type Schema } from '@google/genai';
import type { Level } from '@/types/review';
import { submitReviewSchema, type SubmitReviewInput } from '@/lib/review-schema';
import { buildSystemPrompt, buildUserMessage } from '@/lib/prompt';

// 모델 ID는 배포 전 https://ai.google.dev/gemini-api/docs/models 에서 재확인 후 고정한다
// (PRD 5.2·11.2-①과 동일한 원칙 — 원래는 Anthropic Haiku였으나 무료 티어를 위해 Gemini로 교체).
// gemini-2.5-flash는 신규 사용자에게 더 이상 제공되지 않는다는 404 응답을 실제로 받아
// gemini-3.6-flash로 교체함 (2026-08-27, 실제 API 호출로 확인).
export const MODEL_ID = 'gemini-3.6-flash';

const TEMPERATURE = 0.3;
const MAX_OUTPUT_TOKENS = 2048;

// PRD 5.3의 submit_review tool input_schema를 Gemini의 responseSchema로 옮긴 것.
// Gemini는 이 스키마를 디코딩 단계에서 직접 강제하므로 Claude의 tool_choice보다도
// 형식 이탈 가능성이 낮다 — 다만 내용의 의미적 정확성(원문 그대로 복사 등)은
// 여전히 프롬프트(5.4)와 Zod 재검증(review-schema.ts)에 의존한다.
const CORRECTION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    original: { type: Type.STRING, description: '원문에서 그대로 복사한, 고쳐야 할 최소 구간' },
    corrected: { type: Type.STRING, description: '고친 결과' },
    type: { type: Type.STRING, enum: ['spelling', 'grammar', 'natural', 'punctuation'] },
    explanation: { type: Type.STRING, description: '왜 틀렸는지에 대한 한국어 설명 1~2문장' },
    severity: { type: Type.INTEGER, minimum: 1, maximum: 3, description: '1=사소 3=중요' },
    contextBefore: { type: Type.STRING, description: 'original 바로 앞 10~20자 (위치 특정용)' },
  },
  required: ['original', 'corrected', 'type', 'explanation', 'severity', 'contextBefore'],
};

const EXPRESSION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    expression: { type: Type.STRING, description: '추천하는 영어 관용구 또는 표현' },
    meaningKo: { type: Type.STRING, description: '한국어 뜻' },
    kind: { type: Type.STRING, enum: ['idiom', 'phrase'] },
    register: { type: Type.STRING, enum: ['casual', 'neutral', 'formal'] },
    sourceSentence: { type: Type.STRING, description: '이 표현과 연결되는 일기 속 원문 문장 (그대로 복사)' },
    rewritten: { type: Type.STRING, description: 'sourceSentence를 이 표현으로 바꿔 쓴 문장' },
  },
  required: ['expression', 'meaningKo', 'kind', 'register', 'sourceSentence', 'rewritten'],
};

const REVIEW_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    corrections: { type: Type.ARRAY, items: CORRECTION_SCHEMA },
    // Gemini Schema에서 minItems/maxItems는 문자열이다 (protobuf int64 표현).
    expressions: { type: Type.ARRAY, items: EXPRESSION_SCHEMA, minItems: '3', maxItems: '5' },
    praise: { type: Type.STRING, description: '잘 쓴 문장 1개를 짚어 칭찬하는 한국어 한 문장' },
  },
  required: ['corrections', 'expressions', 'praise'],
};

export class MissingApiKeyError extends Error {}
export class SchemaError extends Error {}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // 서버 시작 시가 아니라 첫 요청 시점에 걸린다 — route handler가 AUTH로 정규화해
    // 사용자에게 보여준다.
    throw new MissingApiKeyError('GEMINI_API_KEY is not set');
  }
  client = new GoogleGenAI({ apiKey });
  return client;
}

async function callModel(text: string, level: Level, signal?: AbortSignal): Promise<unknown> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_ID,
    contents: buildUserMessage(text),
    config: {
      systemInstruction: buildSystemPrompt(level),
      temperature: TEMPERATURE,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      responseMimeType: 'application/json',
      responseSchema: REVIEW_RESPONSE_SCHEMA,
      abortSignal: signal,
    },
  });

  const raw = response.text;
  if (!raw) {
    // 안전 필터에 걸려 후보가 비었거나, 그 외 사유로 텍스트가 없는 경우.
    throw new SchemaError('model returned no text (possibly safety-blocked)');
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new SchemaError('model response is not valid JSON');
  }
}

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
  throw lastError instanceof Error ? lastError : new Error('unknown gemini error');
}
