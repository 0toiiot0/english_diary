'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteEntry, getEntry, isExpressionSaved, saveNote, deleteNote, getAllNotes } from '@/lib/store';
import { ReviewResult } from '@/components/review/ReviewResult';
import { EmptyState } from '@/components/states/EmptyState';
import { todayKey } from '@/lib/streak';
import type { DiaryEntry, Expression, ReviewResult as ReviewResultType } from '@/types/review';

function formatDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
}

export default function DiaryDetailPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = use(params);
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setEntry(getEntry(date) ?? null);
    setHydrated(true);
  }, [date]);

  function toggleSaveExpression(expression: Expression) {
    if (isExpressionSaved(expression.expression)) {
      const note = getAllNotes().find(
        (n) => n.expression.trim().toLowerCase() === expression.expression.trim().toLowerCase()
      );
      if (note) deleteNote(note.id);
    } else {
      saveNote(expression, date);
    }
  }

  if (!hydrated) {
    return <div className="skeleton h-40 rounded-[var(--radius-card)]" aria-hidden />;
  }

  if (!entry) {
    return (
      <EmptyState
        title="해당 날짜의 일기를 찾을 수 없어요"
        action={
          <Link href="/diary" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-accent">
            일기 목록으로 돌아가기
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-text-tertiary">{formatDate(entry.date)}</p>
          {entry.title && <h1 className="mt-1 text-xl font-bold text-text-primary">{entry.title}</h1>}
        </div>
        <div className="flex shrink-0 gap-2">
          {entry.date === todayKey() && (
            <Link
              href="/"
              className="flex min-h-11 items-center rounded-[var(--radius-button)] border border-border px-3 text-sm text-text-secondary hover:bg-accent-soft"
            >
              이어쓰기
            </Link>
          )}
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-text-tertiary hover:bg-accent-soft hover:text-text-primary"
            aria-label="일기 삭제"
          >
            🗑
          </button>
        </div>
      </div>

      <p className="diary-text mt-4 rounded-[var(--radius-card)] border border-border bg-surface p-4 text-text-primary shadow-[var(--shadow-card)]">
        {entry.body}
      </p>

      {entry.review ? (
        <ReviewResult
          body={entry.body}
          review={entry.review as ReviewResultType}
          isSaved={(e) => isExpressionSaved(e.expression)}
          onToggleSaveExpression={toggleSaveExpression}
        />
      ) : (
        <p className="mt-6 text-sm text-text-tertiary">아직 첨삭을 받지 않은 일기예요.</p>
      )}

      {confirmDelete && (
        <div role="dialog" aria-modal="true" aria-label="일기 삭제 확인" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-[var(--radius-card)] bg-surface p-5 shadow-lg">
            <p className="text-base font-semibold text-text-primary">이 일기를 삭제할까요?</p>
            <p className="mt-1 text-sm text-text-secondary">삭제하면 되돌릴 수 없어요.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="min-h-11 rounded-[var(--radius-button)] px-4 text-sm font-medium text-text-secondary hover:bg-accent-soft"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteEntry(entry.date);
                  router.push('/diary');
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
