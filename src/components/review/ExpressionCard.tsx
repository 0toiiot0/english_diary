'use client';

import type { Expression, Register } from '@/types/review';

const KIND_LABEL: Record<Expression['kind'], string> = {
  idiom: '관용구',
  phrase: '표현',
};

const REGISTER_LABEL: Record<Register, string> = {
  casual: '캐주얼',
  neutral: '중립',
  formal: '격식',
};

export function ExpressionCard({
  expression,
  saved,
  onToggleSave,
}: {
  expression: Expression;
  saved: boolean;
  onToggleSave: () => void;
}) {
  const e = expression;
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-[17px] font-semibold text-text-primary">{e.expression}</p>
          <div className="mt-1 flex gap-1.5">
            <span className="rounded-[var(--radius-badge)] bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-text">
              {KIND_LABEL[e.kind]}
            </span>
            <span className="rounded-[var(--radius-badge)] border border-border px-2 py-0.5 text-xs text-text-tertiary">
              {REGISTER_LABEL[e.register]}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleSave}
          aria-pressed={saved}
          aria-label={saved ? '표현 노트에서 제거' : '표현 노트에 저장'}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl transition-transform motion-safe:active:scale-90 ${
            saved ? 'text-accent-text' : 'text-text-tertiary hover:text-accent-text'
          }`}
        >
          {saved ? '🔖' : '📑'}
        </button>
      </div>

      <p className="mt-2 text-sm text-text-secondary">{e.meaningKo}</p>

      <div className="mt-4 border-l-2 border-border pl-3">
        <p className="text-xs font-medium text-text-tertiary">내 문장</p>
        <p className="font-serif text-sm italic text-text-secondary">&ldquo;{e.sourceSentence}&rdquo;</p>
      </div>

      <div className="mt-3 rounded-[var(--radius-badge)] bg-accent-soft p-3">
        <p className="text-xs font-medium text-accent-text">이렇게 쓸 수도 있어요</p>
        <p className="font-serif text-sm text-text-primary">&ldquo;{e.rewritten}&rdquo;</p>
      </div>
    </div>
  );
}
