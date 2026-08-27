'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllEntries, onStoreChange } from '@/lib/store';
import { computeStreak, getWrittenDateKeys, todayKey } from '@/lib/streak';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function MonthCalendar() {
  const router = useRouter();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() }; // month: 0-indexed
  });
  const [written, setWritten] = useState<Set<string>>(new Set());
  const [longest, setLongest] = useState<number | null>(null);

  useEffect(() => {
    const refresh = () => {
      const entries = getAllEntries();
      setWritten(getWrittenDateKeys(entries));
      setLongest(computeStreak(entries).longest);
    };
    refresh();
    return onStoreChange('entries', refresh);
  }, []);

  const cells = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const startWeekday = first.getDay(); // 0=Sun
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const items: Array<{ day: number; dateKey: string } | null> = [];
    for (let i = 0; i < startWeekday; i++) items.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      items.push({ day: d, dateKey: `${cursor.year}-${pad2(cursor.month + 1)}-${pad2(d)}` });
    }
    return items;
  }, [cursor]);

  const today = todayKey();

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="이전 달"
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-button)] text-text-secondary hover:bg-accent-soft"
          onClick={() =>
            setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }))
          }
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-text-primary">
          {cursor.year}년 {cursor.month + 1}월
        </p>
        <button
          type="button"
          aria-label="다음 달"
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-button)] text-text-secondary hover:bg-accent-soft"
          onClick={() =>
            setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }))
          }
        >
          ›
        </button>
      </div>
      {longest !== null && longest > 0 && (
        <p className="mb-2 text-xs text-text-tertiary">최장 연속 기록 {longest}일</p>
      )}
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-text-tertiary">
        {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} />;
          const isWritten = written.has(cell.dateKey);
          const isToday = cell.dateKey === today;
          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => router.push(`/diary/${cell.dateKey}`)}
              disabled={!isWritten}
              aria-label={`${cell.dateKey}${isWritten ? ' 일기 있음' : ''}`}
              className={[
                'flex h-9 w-9 items-center justify-center rounded-full text-sm mx-auto',
                isWritten
                  ? 'bg-accent text-white font-semibold hover:opacity-90 cursor-pointer'
                  : 'text-text-tertiary cursor-default',
                isToday && !isWritten ? 'ring-1 ring-accent-text' : '',
              ].join(' ')}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
