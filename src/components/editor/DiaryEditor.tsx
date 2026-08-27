'use client';

import { useEffect, useRef, useState } from 'react';
import { PromptCard } from '@/components/editor/PromptCard';
import { ReviewButton } from '@/components/editor/ReviewButton';
import { ReviewSkeleton } from '@/components/states/ReviewSkeleton';
import { ErrorState } from '@/components/states/ErrorState';
import { ReviewResult } from '@/components/review/ReviewResult';
import { hashText } from '@/lib/hash';
import { STREAK_MIN_BODY_LENGTH, todayKey } from '@/lib/streak';
import {
  getEntry,
  getDraft,
  saveDraft,
  saveEntry,
  getSettings,
  isExpressionSaved,
  saveNote,
  deleteNote,
  getAllNotes,
  onStoreChange,
} from '@/lib/store';
import type { ApiErrorBody, Expression, ReviewResponse } from '@/types/review';

const MAX_LENGTH = 3000;
const MIN_LENGTH = STREAK_MIN_BODY_LENGTH;
const AUTOSAVE_DELAY_MS = 3000;

function hangulRatio(text: string): number {
  const nonSpace = text.replace(/\s/g, '');
  if (nonSpace.length === 0) return 0;
  const hangul = nonSpace.match(/[가-힣ᄀ-ᇿ㄰-㆏]/g);
  return (hangul?.length ?? 0) / nonSpace.length;
}

function formatDateHeader(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
}

export function DiaryEditor() {
  const date = useRef(todayKey()).current;
  const entryMeta = useRef<{ createdAt: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [hydrated, setHydrated] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [dirtySinceReview, setDirtySinceReview] = useState(false);
  const [reviewState, setReviewState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorCode, setErrorCode] = useState<ApiErrorBody['code'] | null>(null);
  const [showSavedFlash, setShowSavedFlash] = useState(false);
  const [notesVersion, setNotesVersion] = useState(0);

  useEffect(() => {
    const existing = getEntry(date);
    if (existing) {
      setTitle(existing.title);
      setBody(existing.body);
      setReview(existing.review as ReviewResponse | null);
      entryMeta.current = { createdAt: existing.createdAt };
    } else {
      const draft = getDraft();
      if (draft && draft.date === date) {
        setTitle(draft.title);
        setBody(draft.body);
      }
    }
    setHydrated(true);
    return onStoreChange('notes', () => setNotesVersion((v) => v + 1));
  }, [date]);

  function persist(nextTitle: string, nextBody: string, nextReview: ReviewResponse | null) {
    const now = new Date().toISOString();
    const createdAt = entryMeta.current?.createdAt ?? now;
    entryMeta.current = { createdAt };
    saveDraft({ date, title: nextTitle, body: nextBody, savedAt: now });
    saveEntry({ date, title: nextTitle, body: nextBody, createdAt, updatedAt: now, review: nextReview });
    setShowSavedFlash(true);
    if (savedFlashRef.current) clearTimeout(savedFlashRef.current);
    savedFlashRef.current = setTimeout(() => setShowSavedFlash(false), 3000);
  }

  function scheduleAutosave(nextTitle: string, nextBody: string, nextReview: ReviewResponse | null) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => persist(nextTitle, nextBody, nextReview), AUTOSAVE_DELAY_MS);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedFlashRef.current) clearTimeout(savedFlashRef.current);
    };
  }, []);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    scheduleAutosave(value, body, review);
  };

  const handleBodyChange = (value: string) => {
    const next = value.length > MAX_LENGTH ? value.slice(0, MAX_LENGTH) : value;
    setBody(next);
    if (review) setDirtySinceReview(true);
    scheduleAutosave(title, next, review);
  };

  const handleReview = async () => {
    if (body.trim().length < MIN_LENGTH || reviewState === 'loading') return;

    const hash = hashText(body);
    if (review && review.textHash === hash && !dirtySinceReview) {
      return; // 동일 본문 재요청 차단 (5.5)
    }

    setReviewState('loading');
    setErrorCode(null);
    try {
      const level = getSettings().level;
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: body, level }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewState('error');
        setErrorCode((data as ApiErrorBody).code ?? 'SERVER');
        return;
      }
      const result = data as ReviewResponse;
      setReview(result);
      setDirtySinceReview(false);
      setReviewState('idle');
      persist(title, body, result);
    } catch {
      setReviewState('error');
      setErrorCode('NETWORK');
    }
  };

  if (!hydrated) {
    return <div className="skeleton h-40 rounded-[var(--radius-card)]" aria-hidden />;
  }

  const charCount = body.length;
  const wordCount = body.trim().length === 0 ? 0 : body.trim().split(/\s+/).length;
  const showKoreanNotice = body.trim().length > 0 && hangulRatio(body) >= 0.3;
  const showCappedNotice = charCount >= MAX_LENGTH;
  const belowMin = body.trim().length < MIN_LENGTH;

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

  return (
    <div>
      <PromptCard dateKey={date} collapsed={body.trim().length > 0} />

      <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
        <p className="text-sm font-medium text-text-tertiary">{formatDateHeader(date)}</p>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="제목 (선택)"
          className="mt-2 w-full border-none bg-transparent text-lg font-semibold text-text-primary outline-none placeholder:text-text-tertiary"
        />
        <textarea
          value={body}
          onChange={(e) => handleBodyChange(e.target.value)}
          placeholder="Write about your day in English…"
          rows={10}
          maxLength={MAX_LENGTH}
          className="diary-text mt-2 w-full resize-y border-none bg-transparent outline-none placeholder:text-text-tertiary"
        />
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-tertiary">
          <span>
            {charCount}/{MAX_LENGTH}자 · {wordCount} 단어
          </span>
          {showSavedFlash && <span className="text-accent">방금 저장됨</span>}
          {showCappedNotice && <span className="text-[var(--err-spelling-strong)]">3,000자를 넘을 수 없어요.</span>}
        </div>
        {showKoreanNotice && (
          <p className="mt-1 text-xs text-text-tertiary">영어로 써주세요. (한국어 비중이 높아요)</p>
        )}
        {belowMin && body.trim().length > 0 && (
          <p className="mt-1 text-xs text-text-tertiary">조금만 더 써볼까요? (최소 {MIN_LENGTH}자)</p>
        )}
      </div>

      <div className="sticky bottom-[68px] z-20 -mx-4 mt-3 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <ReviewButton
          label={review ? '다시 첨삭 받기' : '첨삭 받기'}
          disabled={belowMin}
          loading={reviewState === 'loading'}
          onClick={handleReview}
        />
      </div>

      {reviewState === 'loading' && <ReviewSkeleton />}
      {reviewState === 'error' && errorCode && <ErrorState code={errorCode} onRetry={handleReview} />}

      {review && reviewState !== 'loading' && (
        <div className={dirtySinceReview ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          {dirtySinceReview && (
            <p className="mt-4 text-xs font-medium text-text-tertiary">
              본문이 수정되었어요 · &ldquo;다시 첨삭 받기&rdquo;를 눌러 최신 결과를 받아보세요.
            </p>
          )}
          <ReviewResult
            key={notesVersion}
            body={body}
            review={review}
            isSaved={(e) => isExpressionSaved(e.expression)}
            onToggleSaveExpression={toggleSaveExpression}
          />
        </div>
      )}
    </div>
  );
}
