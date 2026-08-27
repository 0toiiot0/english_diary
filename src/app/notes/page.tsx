'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { deleteNote, getAllNotes, onStoreChange } from '@/lib/store';
import { EmptyState } from '@/components/states/EmptyState';
import type { SavedExpression } from '@/types/review';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function NotesPage() {
  const [notes, setNotes] = useState<SavedExpression[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const refresh = () => setNotes(getAllNotes());
    refresh();
    return onStoreChange('notes', refresh);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return notes;
    const q = query.trim().toLowerCase();
    return notes.filter((n) => n.expression.toLowerCase().includes(q) || n.meaningKo.includes(q));
  }, [notes, query]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-text-primary md:text-[28px]">표현 노트</h1>

      {notes.length > 0 && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="표현·뜻으로 검색"
          className="mt-4 w-full rounded-[var(--radius-button)] border border-border bg-surface px-3 py-2.5 text-sm outline-none focus-visible:border-accent-text"
        />
      )}

      {notes.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="아직 저장한 표현이 없어요"
            description="일기를 첨삭받고 마음에 드는 표현을 저장해보세요"
            action={
              <Link href="/" className="mt-2 inline-flex min-h-11 items-center rounded-[var(--radius-button)] bg-accent px-4 text-sm font-semibold text-white">
                오늘의 일기 쓰러 가기
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {filtered.map((note) => (
            <li key={note.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between gap-2">
                <p className="font-serif text-[17px] font-semibold text-text-primary">{note.expression}</p>
                <button
                  type="button"
                  aria-label={`${note.expression} 삭제`}
                  onClick={() => deleteNote(note.id)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-tertiary hover:bg-accent-soft hover:text-text-primary"
                >
                  ✕
                </button>
              </div>
              <p className="mt-1 text-sm text-text-secondary">{note.meaningKo}</p>
              <p className="mt-2 font-serif text-sm italic text-text-secondary">&ldquo;{note.rewritten}&rdquo;</p>
              <div className="mt-3 flex items-center justify-between text-xs text-text-tertiary">
                <span>{formatDate(note.savedAt)} 저장</span>
                <Link href={`/diary/${note.sourceDate}`} className="font-medium text-accent-text hover:underline">
                  처음 본 일기 보기
                </Link>
              </div>
            </li>
          ))}
          {filtered.length === 0 && <p className="col-span-full mt-6 text-center text-sm text-text-tertiary">검색 결과가 없어요.</p>}
        </ul>
      )}
    </div>
  );
}
