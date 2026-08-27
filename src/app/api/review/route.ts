import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { reviewDiary, SchemaError, MissingApiKeyError } from '@/lib/claude';
import { matchCorrections } from '@/lib/match';
import { checkRateLimit } from '@/lib/rate-limit';
import { hashText } from '@/lib/hash';
import type { ApiErrorBody, ErrorCode, Level, ReviewRequest, ReviewResponse } from '@/types/review';

export const runtime = 'nodejs';

const MAX_LENGTH = 3000;
const TIMEOUT_MS = 30_000;
const VALID_LEVELS: Level[] = ['beginner', 'intermediate', 'advanced'];

function errorResponse(code: ErrorCode, status: number): NextResponse<ApiErrorBody> {
  const message = ERROR_MESSAGES[code];
  return NextResponse.json({ code, message }, { status });
}

// ER-01~08 — 정규화 코드별 사용자 노출 메시지. 원본 API 오류·스택은 절대 전달하지 않는다 (ER-11).
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  NETWORK: '네트워크 연결을 확인해 주세요.',
  AUTH: '일시적인 문제가 발생했어요. 잠시 후 다시 시도해 주세요.',
  RATE_LIMIT: '지금 요청이 많아요. 잠시 후 다시 시도해 주세요.',
  SCHEMA: '결과를 읽는 데 실패했어요. 다시 시도해 주세요.',
  TIMEOUT: '응답이 지연되고 있어요. 일기가 너무 길면 조금 줄여보세요.',
  TOO_LONG: '일기가 너무 길어요. 3,000자 이내로 줄여주세요.',
  SERVER: '일시적인 문제가 발생했어요. 잠시 후 다시 시도해 주세요.',
};

function isAllowedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin') ?? req.headers.get('referer');
  if (!origin) return true; // 서버 간 curl 등 origin 헤더가 없는 요청은 통과 (완전한 방어 수단이 아님, PRD 6.7)
  try {
    const originHost = new URL(origin).host;
    const selfHost = req.headers.get('host');
    return !selfHost || originHost === selfHost;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!isAllowedOrigin(req)) {
    return errorResponse('SERVER', 403);
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return errorResponse('RATE_LIMIT', 429);
  }

  let body: ReviewRequest;
  try {
    body = await req.json();
  } catch {
    return errorResponse('SERVER', 400);
  }

  const { text, level } = body ?? ({} as ReviewRequest);

  if (typeof text !== 'string' || typeof level !== 'string' || !VALID_LEVELS.includes(level)) {
    return errorResponse('SERVER', 400);
  }
  // 클라이언트 검증(ED-05)을 믿지 않고 서버에서 재검증한다 (5.5).
  if (text.length > MAX_LENGTH) {
    return errorResponse('TOO_LONG', 400);
  }
  if (text.trim().length === 0) {
    return errorResponse('SERVER', 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // 요청 본문(일기 전문)은 절대 로깅하지 않는다 (6.5) — 길이 등 메타데이터만 남긴다.
    console.info('[review] request', { length: text.length, level });

    const { result, model } = await reviewDiary(text, level, controller.signal);
    const corrections = matchCorrections(text, result.corrections);
    const unmatchedCount = corrections.filter((c) => !c.matched).length;

    const response: ReviewResponse = {
      corrections,
      expressions: result.expressions.map((e) => ({ ...e, id: crypto.randomUUID() })),
      praise: result.praise,
      reviewedAt: new Date().toISOString(),
      level,
      model,
      textHash: hashText(text),
      unmatchedCount,
    };

    if (unmatchedCount > 0) {
      console.info('[review] unmatched corrections', { unmatchedCount, total: corrections.length });
    }

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    return handleError(err);
  } finally {
    clearTimeout(timeout);
  }
}

function handleError(err: unknown): NextResponse<ApiErrorBody> {
  if (err instanceof SchemaError) {
    return errorResponse('SCHEMA', 502);
  }
  if (err instanceof Error && err.name === 'AbortError') {
    return errorResponse('TIMEOUT', 504);
  }
  if (
    err instanceof MissingApiKeyError ||
    err instanceof Anthropic.AuthenticationError ||
    err instanceof Anthropic.PermissionDeniedError
  ) {
    return errorResponse('AUTH', 502);
  }
  if (err instanceof Anthropic.RateLimitError) {
    return errorResponse('RATE_LIMIT', 429);
  }
  if (err instanceof Anthropic.APIConnectionTimeoutError) {
    return errorResponse('TIMEOUT', 504);
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return errorResponse('NETWORK', 502);
  }
  // 원본 오류 메시지·스택은 클라이언트로 전달하지 않는다 (ER-11). 서버 로그에만 남긴다.
  console.error('[review] unexpected error', err instanceof Error ? err.message : err);
  return errorResponse('SERVER', 500);
}
