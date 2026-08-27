'use client';

import { useState } from 'react';
import { getNextPrompt, getPromptForDate, type DiaryPrompt } from '@/lib/prompts-data';

export function PromptCard({ dateKey, collapsed }: { dateKey: string; collapsed: boolean }) {
  const [prompt, setPrompt] = useState<DiaryPrompt>(() => getPromptForDate(dateKey));
  const [forceExpanded, setForceExpanded] = useState(false);

  const showCollapsed = collapsed && !forceExpanded;

  if (showCollapsed) {
    return (
      <button
        type="button"
        className="mb-3 w-full rounded-[var(--radius-badge)] border border-border bg-surface px-3 py-2 text-left text-xs text-text-tertiary hover:bg-accent-soft"
        aria-label="오늘의 글감 다시 펼치기"
        onClick={() => setForceExpanded(true)}
      >
        오늘의 글감: {prompt.en}
      </button>
    );
  }

  return (
    <div className="mb-4 rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <p className="mb-1 text-xs font-medium text-text-tertiary">오늘의 글감</p>
      <p className="font-serif text-base text-text-primary">{prompt.en}</p>
      <p className="mt-1 text-sm text-text-secondary">{prompt.ko}</p>
      <button
        type="button"
        onClick={() => setPrompt((p) => getNextPrompt(p))}
        className="mt-3 min-h-11 rounded-[var(--radius-button)] border border-border px-3 text-sm text-text-secondary hover:bg-accent-soft"
      >
        다른 글감 보기
      </button>
    </div>
  );
}
