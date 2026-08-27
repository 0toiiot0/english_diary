'use client';

import { useMemo } from 'react';
import type { Correction, ErrorType } from '@/types/review';

const TYPE_LABEL_KO: Record<ErrorType, string> = {
  spelling: '철자',
  grammar: '문법',
  natural: '어색한 표현',
  punctuation: '문장부호',
};

interface Segment {
  key: string;
  text: string;
  correction: Correction | null;
}

/**
 * 매칭된 오류 구간만 조각내어 하이라이트로 렌더한다.
 * 절대 dangerouslySetInnerHTML을 쓰지 않는다 — 원문은 사용자 입력이라 <script> 등이
 * 들어올 수 있고, React 텍스트 노드로만 렌더해야 자동으로 이스케이프된다.
 */
function buildSegments(text: string, corrections: Correction[]): Segment[] {
  const spans = corrections
    .filter((c): c is Correction & { start: number; end: number } => c.matched && c.start !== null && c.end !== null)
    .sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const c of spans) {
    if (c.start > cursor) {
      segments.push({ key: `plain-${cursor}`, text: text.slice(cursor, c.start), correction: null });
    }
    segments.push({ key: c.id, text: text.slice(c.start, c.end), correction: c });
    cursor = c.end;
  }
  if (cursor < text.length) {
    segments.push({ key: `plain-${cursor}`, text: text.slice(cursor), correction: null });
  }
  return segments;
}

export function HighlightedText({
  text,
  corrections,
  activeId,
  onHighlightClick,
  onHighlightHover,
}: {
  text: string;
  corrections: Correction[];
  activeId: string | null;
  onHighlightClick: (id: string) => void;
  onHighlightHover: (id: string | null) => void;
}) {
  const segments = useMemo(() => buildSegments(text, corrections), [text, corrections]);

  return (
    <p className="diary-text text-text-primary">
      {segments.map((seg) => {
        if (!seg.correction) return <span key={seg.key}>{seg.text}</span>;
        const c = seg.correction;
        return (
          <button
            key={seg.key}
            type="button"
            className={`hl hl-${c.type} ${activeId === c.id ? 'hl-active' : ''}`}
            onClick={() => onHighlightClick(c.id)}
            onMouseEnter={() => onHighlightHover(c.id)}
            onMouseLeave={() => onHighlightHover(null)}
            onFocus={() => onHighlightHover(c.id)}
            onBlur={() => onHighlightHover(null)}
            aria-label={`${TYPE_LABEL_KO[c.type]} 오류: ${c.original}, 수정 제안 ${c.corrected}`}
          >
            {seg.text}
          </button>
        );
      })}
    </p>
  );
}
