'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[error.tsx] unexpected render error', error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto max-w-md py-16 text-center">
      <p className="text-base font-semibold text-text-primary">문제가 발생했어요.</p>
      <p className="mt-2 text-sm text-text-secondary">
        예상치 못한 오류가 발생했어요. 걱정 마세요 — 작성 중인 일기는 자동 임시저장되어 있어요.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 min-h-11 rounded-[var(--radius-button)] bg-accent px-4 py-2 text-sm font-semibold text-white"
      >
        다시 시도
      </button>
    </div>
  );
}
