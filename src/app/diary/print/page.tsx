'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllEntries } from '@/lib/store';
import type { DiaryEntry } from '@/types/review';

function formatDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

/**
 * 일기 PDF 내보내기 — 첨삭 결과(오류·표현 추천)는 제외하고 본문만 담는다.
 * 별도 라이브러리 없이 브라우저 인쇄(=PDF로 저장)를 그대로 쓴다 — 일기 본문이
 * 어디로도 전송되지 않고 클라이언트에서만 PDF가 만들어진다는 원칙(6.5)과도 맞는다.
 * 화면·인쇄 모두 사이트 테마(다크모드)와 무관하게 항상 흰 배경·검정 글자로 고정한다.
 */
export default function DiaryPrintPage() {
  const [hydrated, setHydrated] = useState(false);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    const sorted = [...getAllEntries()].sort((a, b) => (a.date < b.date ? -1 : 1));
    setEntries(sorted);
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  return (
    <div className="bg-white text-black">
      <div className="print:hidden mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
        <Link href="/diary" className="text-sm font-medium text-gray-600 hover:text-black">
          ← 일기 목록으로
        </Link>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-11 rounded-md bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-700"
          >
            PDF로 저장
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="print:hidden text-sm text-gray-500">아직 내보낼 일기가 없어요.</p>
      ) : (
        <article className="mx-auto max-w-2xl">
          <header className="mb-10 border-b border-gray-300 pb-6 text-center">
            <h1 className="font-serif text-2xl font-bold">DayNote — 나의 영어 일기</h1>
            <p className="mt-2 text-sm text-gray-500">
              {formatDate(entries[0].date)} ~ {formatDate(entries[entries.length - 1].date)} · 총{' '}
              {entries.length}편
            </p>
          </header>

          {entries.map((entry) => (
            <section key={entry.date} className="break-inside-avoid mb-10">
              <p className="text-xs font-medium text-gray-500">{formatDate(entry.date)}</p>
              {entry.title && <h2 className="mt-1 text-lg font-bold">{entry.title}</h2>}
              <p className="font-serif mt-2 whitespace-pre-wrap text-[15px] leading-[1.9] text-black">
                {entry.body}
              </p>
            </section>
          ))}
        </article>
      )}
    </div>
  );
}
