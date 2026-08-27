'use client';

import { useEffect, useState } from 'react';
import type { ErrorCode } from '@/types/review';

// ER-01~08 사용자 노출 메시지. 원본 API 오류는 노출하지 않는다 (ER-11).
const MESSAGES: Record<ErrorCode, string> = {
  NETWORK: '네트워크 연결을 확인해 주세요.',
  AUTH: '일시적인 문제가 발생했어요. 잠시 후 다시 시도해 주세요.',
  RATE_LIMIT: '지금 요청이 많아요. 30초 뒤에 다시 시도해 주세요.',
  SCHEMA: '결과를 읽는 데 실패했어요. 다시 시도해 주세요.',
  TIMEOUT: '응답이 지연되고 있어요. 일기가 너무 길면 조금 줄여보세요.',
  TOO_LONG: '일기가 너무 길어요. 3,000자 이내로 줄여주세요.',
  SERVER: '일시적인 문제가 발생했어요. 잠시 후 다시 시도해 주세요.',
};

export function ErrorState({ code, onRetry }: { code: ErrorCode; onRetry: () => void }) {
  const isRateLimited = code === 'RATE_LIMIT';
  const [countdown, setCountdown] = useState(isRateLimited ? 30 : 0);

  useEffect(() => {
    if (!isRateLimited) return;
    setCountdown(30);
    const timer = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isRateLimited, code]);

  const disabled = isRateLimited && countdown > 0;

  return (
    <div
      role="alert"
      className="mt-6 rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
    >
      <p className="text-sm text-text-primary">{MESSAGES[code]}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={disabled}
        className="mt-3 min-h-11 rounded-[var(--radius-button)] bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {disabled ? `다시 시도 (${countdown}초)` : '다시 시도'}
      </button>
    </div>
  );
}
