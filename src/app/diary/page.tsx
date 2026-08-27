'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { deleteEntry, getAllEntries, onStoreChange } from '@/lib/store';
import { EmptyState } from '@/components/states/EmptyState';
import type { DiaryEntry } from '@/types/review';

function firstLine(body: string): string {
  const line = body.trim().split(/\r?\n/)[0] ?? '';
  return line.length > 60 ? `${line.slice(0, 60)}…` : line;
}

function formatDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
}

export default function DiaryListPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [query, setQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setEntries(getAllEntries());
    refresh();
    return onStoreChange('entries', refresh);
  }, []);

  const filtered = useMemo(() => {
    const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));
    if (!query.trim()) return sorted;
    const q = query.trim().toLowerCase();
    return sorted.filter((e) => e.body.toLowerCase().includes(q) || e.title.toLowerCase().includes(q));
  }, [entries, query]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary md:text-[28px]">일기 목록</h1>
        {entries.length > 0 && (
          <Link
            href="/diary/print"
            className="shrink-0 rounded-[var(--radius-button)] border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:bg-accent-soft"
          >
            PDF로 내보내기
          </Link>
        )}
      </div>

      {entries.length > 0 && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="본문에서 검색"
          className="mt-4 w-full rounded-[var(--radius-button)] border border-border bg-surface px-3 py-2.5 text-sm outline-none focus-visible:border-accent-text"
        />
      )}

      {entries.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="아직 쓴 일기가 없어요"
            description="첫 일기를 써보세요. 3줄이어도 괜찮아요."
            action={
              <Link
                href="/"
                className="mt-2 inline-flex min-h-11 items-center rounded-[var(--radius-button)] bg-accent px-4 text-sm font-semibold text-white"
              >
                오늘의 일기 쓰러 가기
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {filtered.map((entry) => (
            <li key={entry.date}>
              <div className="flex items-center gap-2 rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
                <Link href={`/diary/${entry.date}`} className="min-w-0 flex-1">
                  <p className="text-xs text-text-tertiary">{formatDate(entry.date)}</p>
                  <p className="mt-0.5 truncate font-serif text-[15px] text-text-primary">
                    {entry.title || firstLine(entry.body) || '(내용 없음)'}
                  </p>
                </Link>
                {entry.review && (
                  <span className="shrink-0 rounded-[var(--radius-badge)] bg-accent-soft px-2 py-1 text-xs font-medium text-accent-text">
                    오류 {entry.review.corrections.length}개
                  </span>
                )}
                <button
                  type="button"
                  aria-label={`${entry.date} 일기 삭제`}
                  onClick={() => setPendingDelete(entry.date)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-tertiary hover:bg-accent-soft hover:text-text-primary"
                >
                  🗑
                </button>
              </div>
            </li>
          ))}
          {filtered.length === 0 && <p className="mt-6 text-center text-sm text-text-tertiary">검색 결과가 없어요.</p>}
        </ul>
      )}

      {pendingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="일기 삭제 확인"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-sm rounded-[var(--radius-card)] bg-surface p-5 shadow-lg">
            <p className="text-base font-semibold text-text-primary">이 일기를 삭제할까요?</p>
            <p className="mt-1 text-sm text-text-secondary">삭제하면 되돌릴 수 없어요.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="min-h-11 rounded-[var(--radius-button)] px-4 text-sm font-medium text-text-secondary hover:bg-accent-soft"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteEntry(pendingDelete);
                  setPendingDelete(null);
                }}
                className="min-h-11 rounded-[var(--radius-button)] bg-accent px-4 text-sm font-semibold text-white"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
