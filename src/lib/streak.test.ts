import { describe, expect, it } from 'vitest';
import { addDaysToKey, computeStreak } from './streak';
import type { DiaryEntry } from '@/types/review';

function entry(date: string, bodyLen = 20): DiaryEntry {
  return {
    date,
    title: '',
    body: 'x'.repeat(bodyLen),
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
    review: null,
  };
}

describe('computeStreak (ST-05~07)', () => {
  it('오늘까지 연속 3일 작성 → current 3', () => {
    const today = '2026-08-27';
    const entries = [addDaysToKey(today, -2), addDaysToKey(today, -1), today].map((d) => entry(d));
    const streak = computeStreak(entries, today);
    expect(streak.current).toBe(3);
    expect(streak.writtenToday).toBe(true);
  });

  it('오늘 아직 안 썼지만 어제까지 연속이면 끊긴 것으로 표시하지 않는다 (ST-07)', () => {
    const today = '2026-08-27';
    const entries = [addDaysToKey(today, -2), addDaysToKey(today, -1)].map((d) => entry(d));
    const streak = computeStreak(entries, today);
    expect(streak.writtenToday).toBe(false);
    expect(streak.current).toBe(2);
  });

  it('어제도 안 썼으면 오늘 스트릭은 0', () => {
    const today = '2026-08-27';
    const entries = [addDaysToKey(today, -5)].map((d) => entry(d));
    const streak = computeStreak(entries, today);
    expect(streak.current).toBe(0);
  });

  it('20자 미만 본문은 작성으로 인정하지 않는다 (ED-06과 정합)', () => {
    const today = '2026-08-27';
    const entries = [entry(today, 5)];
    const streak = computeStreak(entries, today);
    expect(streak.writtenToday).toBe(false);
    expect(streak.current).toBe(0);
  });

  it('최장 기록은 현재 스트릭이 끊긴 뒤에도 유지된다', () => {
    const today = '2026-08-27';
    const entries = [
      addDaysToKey(today, -10),
      addDaysToKey(today, -9),
      addDaysToKey(today, -8),
      addDaysToKey(today, -7),
      // 이후 공백 — 현재 스트릭은 0
    ].map((d) => entry(d));
    const streak = computeStreak(entries, today);
    expect(streak.current).toBe(0);
    expect(streak.longest).toBe(4);
  });

  it('첨삭을 받지 않아도 작성만으로 인정한다 (ST-06)', () => {
    const today = '2026-08-27';
    const e = entry(today);
    expect(e.review).toBeNull();
    const streak = computeStreak([e], today);
    expect(streak.writtenToday).toBe(true);
  });
});
