'use client';

import { useEffect, useState } from 'react';
import { computeStreak } from '@/lib/streak';
import { getAllEntries, onStoreChange } from '@/lib/store';

export function StreakBadge() {
  const [current, setCurrent] = useState<number | null>(null);

  useEffect(() => {
    const refresh = () => setCurrent(computeStreak(getAllEntries()).current);
    refresh();
    return onStoreChange('entries', refresh);
  }, []);

  if (current === null) {
    // 첫 렌더(hydration 전)에는 자리만 차지하고 값은 비워둔다 — 서버/클라 불일치 방지
    return <span className="inline-flex h-7 w-16 rounded-full" aria-hidden />;
  }

  if (current === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-tertiary">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-text-tertiary" aria-hidden />
        오늘 첫 일기를 써보세요
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent"
      role="status"
    >
      🔥 {current}일 연속
    </span>
  );
}
