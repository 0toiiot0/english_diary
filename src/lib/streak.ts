import type { DiaryEntry } from '@/types/review';

/**
 * 스트릭 계산 (PRD 3.5, ST-05~07).
 * - 로컬 시간대 기준 날짜(YYYY-MM-DD)에 본문 20자 이상 저장된 일기가 있으면 1일 인정 (ST-05)
 * - 첨삭 여부와 무관하게 "작성"만으로 인정한다 (ST-06)
 * - 오늘 아직 안 썼으면 어제까지의 스트릭을 유지 표시하고 끊긴 것으로 표시하지 않는다 (ST-07)
 *
 * 로컬 날짜 계산에는 절대 `toISOString()`(UTC)을 쓰지 않는다 — 자정 근처에서
 * 사용자의 로컬 날짜와 어긋난다.
 */

export const STREAK_MIN_BODY_LENGTH = 20;

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDaysToKey(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return toDateKey(dt);
}

export function getWrittenDateKeys(entries: DiaryEntry[]): Set<string> {
  return new Set(
    entries.filter((e) => e.body.trim().length >= STREAK_MIN_BODY_LENGTH).map((e) => e.date)
  );
}

export interface StreakInfo {
  current: number;
  longest: number;
  writtenToday: boolean;
}

export function computeStreak(entries: DiaryEntry[], today: string = todayKey()): StreakInfo {
  const written = getWrittenDateKeys(entries);
  const yesterday = addDaysToKey(today, -1);

  function countBackFrom(startKey: string): number {
    let count = 0;
    let cursor = startKey;
    while (written.has(cursor)) {
      count++;
      cursor = addDaysToKey(cursor, -1);
    }
    return count;
  }

  const writtenToday = written.has(today);
  const current = writtenToday ? countBackFrom(today) : countBackFrom(yesterday);

  let longest = current;
  const sorted = [...written].sort();
  let prev: string | null = null;
  let runLen = 0;
  for (const key of sorted) {
    runLen = prev !== null && addDaysToKey(prev, 1) === key ? runLen + 1 : 1;
    longest = Math.max(longest, runLen);
    prev = key;
  }

  return { current, longest, writtenToday };
}
