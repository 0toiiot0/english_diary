'use client';

import { useMemo, useState } from 'react';
import type { Correction, Expression, ReviewResult as ReviewResultType } from '@/types/review';
import { HighlightedText } from '@/components/review/HighlightedText';
import { CorrectionCard } from '@/components/review/CorrectionCard';
import { ExpressionCard } from '@/components/review/ExpressionCard';
import { PraiseCard } from '@/components/review/PraiseCard';

const VISIBLE_LIMIT = 15; // CR-10 — 초급자 좌절 방지

function buildFullyCorrectedText(body: string, corrections: Correction[]): string {
  const matched = corrections
    .filter((c): c is Correction & { start: number; end: number } => c.matched && c.start !== null && c.end !== null)
    .sort((a, b) => b.start - a.start); // 뒤에서부터 치환해야 인덱스가 안 밀린다
  let result = body;
  for (const c of matched) {
    result = result.slice(0, c.start) + c.corrected + result.slice(c.end);
  }
  return result;
}

function scrollToCard(id: string) {
  const el = document.getElementById(`correction-${id}`);
  if (!el) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
}

export function ReviewResult({
  body,
  review,
  isSaved,
  onToggleSaveExpression,
}: {
  body: string;
  review: ReviewResultType;
  isSaved: (expression: Expression) => boolean;
  onToggleSaveExpression: (expression: Expression) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showFullCorrected, setShowFullCorrected] = useState(false);

  const { visible, hidden } = useMemo(() => {
    const bySeverity = [...review.corrections].sort((a, b) => b.severity - a.severity);
    const visibleIds = new Set(bySeverity.slice(0, VISIBLE_LIMIT).map((c) => c.id));
    return {
      visible: review.corrections.filter((c) => visibleIds.has(c.id)),
      hidden: review.corrections.filter((c) => !visibleIds.has(c.id)),
    };
  }, [review.corrections]);

  const shownCorrections = expanded ? review.corrections : visible;
  const fullyCorrected = useMemo(() => buildFullyCorrectedText(body, review.corrections), [body, review.corrections]);

  const handleHighlightClick = (id: string) => {
    setActiveId(id);
    scrollToCard(id);
  };

  return (
    <section aria-live="polite" className="mt-6">
      <p className="text-sm font-medium text-text-secondary">
        고칠 곳 {review.corrections.length}개 · 추천 표현 {review.expressions.length}개
      </p>

      <div className="mt-3 rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] md:sticky md:top-20">
        <HighlightedText
          text={body}
          corrections={shownCorrections}
          activeId={activeId}
          onHighlightClick={handleHighlightClick}
          onHighlightHover={setActiveId}
        />
      </div>

      {review.corrections.length > 0 && (
        <button
          type="button"
          onClick={() => setShowFullCorrected((v) => !v)}
          className="mt-2 min-h-11 text-sm font-medium text-accent-text underline underline-offset-4"
        >
          {showFullCorrected ? '수정문 전체 보기 닫기' : '수정문 전체 보기'}
        </button>
      )}
      {showFullCorrected && (
        <p className="diary-text mt-2 rounded-[var(--radius-card)] border border-border bg-accent-soft p-4 text-text-primary">
          {fullyCorrected}
        </p>
      )}

      <div className="mt-5 space-y-3">
        {review.corrections.length === 0 ? (
          <PraiseCard praise={review.praise} />
        ) : (
          <>
            {shownCorrections.map((c) => (
              <CorrectionCard key={c.id} correction={c} active={activeId === c.id} onHover={setActiveId} />
            ))}
            {!expanded && hidden.length > 0 && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="min-h-11 w-full rounded-[var(--radius-button)] border border-border bg-surface text-sm font-medium text-text-secondary hover:bg-accent-soft"
              >
                그 외 {hidden.length}개 더 보기
              </button>
            )}
          </>
        )}
      </div>

      <div className="mt-8">
        <p className="mb-3 text-sm font-semibold text-text-primary">💡 이런 표현은 어때요?</p>
        {review.expressions.length === 0 ? (
          <p role="alert" className="text-sm text-text-tertiary">
            추천 표현을 가져오지 못했어요. 위 첨삭 결과는 정상이에요.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {review.expressions.map((e) => (
              <ExpressionCard
                key={e.id}
                expression={e}
                saved={isSaved(e)}
                onToggleSave={() => onToggleSaveExpression(e)}
              />
            ))}
          </div>
        )}
      </div>

      <p className="mt-8 text-xs leading-relaxed text-text-tertiary">
        AI가 생성한 첨삭 결과입니다. AI 첨삭은 참고용이며 항상 정확하지 않을 수 있어요. 특히 관용구 추천은
        뉘앙스가 어긋날 수 있어요.
      </p>
    </section>
  );
}
