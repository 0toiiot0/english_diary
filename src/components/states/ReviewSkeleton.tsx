'use client';

import { useEffect, useState } from 'react';

const STAGES = ['문장을 읽는 중…', '문법을 확인하는 중…', '어울리는 표현을 고르는 중…'];
const STAGE_INTERVAL_MS = 2500;

export function ReviewSkeleton() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStageIndex((i) => (i + 1) % STAGES.length);
    }, STAGE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div aria-busy="true" role="status" className="mt-6 space-y-4">
      <p className="text-sm font-medium text-accent">{STAGES[stageIndex]}</p>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
        >
          <div className="skeleton mb-2 h-4 w-16 rounded-[var(--radius-badge)]" />
          <div className="skeleton mb-2 h-4 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
}
