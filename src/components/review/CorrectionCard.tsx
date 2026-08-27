'use client';

import type { Correction, ErrorType } from '@/types/review';

const TYPE_LABEL_KO: Record<ErrorType, string> = {
  spelling: '철자',
  grammar: '문법',
  natural: '어색한 표현',
  punctuation: '문장부호',
};

const TYPE_BAR_COLOR: Record<ErrorType, string> = {
  spelling: 'var(--err-spelling)',
  grammar: 'var(--err-grammar)',
  natural: 'var(--err-natural)',
  punctuation: 'var(--err-punct)',
};

const TYPE_BADGE_CLASS: Record<ErrorType, string> = {
  spelling: 'bg-[var(--err-spelling-tint)] text-[var(--err-spelling-strong)]',
  grammar: 'bg-[var(--err-grammar-tint)] text-[var(--err-grammar-strong)]',
  natural: 'bg-[var(--err-natural-tint)] text-[var(--err-natural-strong)]',
  punctuation: 'bg-[var(--err-punct-tint)] text-[var(--err-punct-strong)]',
};

export function CorrectionCard({
  correction,
  active,
  onHover,
}: {
  correction: Correction;
  active: boolean;
  onHover: (id: string | null) => void;
}) {
  const c = correction;
  return (
    <div
      id={`correction-${c.id}`}
      className={`flex gap-3 rounded-[var(--radius-card)] border bg-surface p-4 shadow-[var(--shadow-card)] transition-colors ${
        active ? 'border-accent' : 'border-border'
      }`}
      onMouseEnter={() => c.matched && onHover(c.id)}
      onMouseLeave={() => c.matched && onHover(null)}
    >
      <span
        aria-hidden
        className="mt-0.5 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: TYPE_BAR_COLOR[c.type] }}
      />
      <div className="min-w-0 flex-1">
        <span
          className={`inline-block rounded-[var(--radius-badge)] px-2 py-0.5 text-xs font-semibold ${TYPE_BADGE_CLASS[c.type]}`}
        >
          {TYPE_LABEL_KO[c.type]}
        </span>
        <p className="mt-2 font-serif text-[15px]">
          <span className="text-text-tertiary line-through">{c.original}</span>{' '}
          <span aria-hidden>→</span>{' '}
          <span className="font-semibold" style={{ color: TYPE_BAR_COLOR[c.type] }}>
            {c.corrected}
          </span>
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{c.explanation}</p>
        {!c.matched && (
          <p className="mt-1.5 text-xs text-text-tertiary">
            원문에서 정확한 위치를 찾지 못했어요. 위 설명을 참고해 직접 확인해보세요.
          </p>
        )}
      </div>
    </div>
  );
}
