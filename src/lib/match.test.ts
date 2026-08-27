import { describe, expect, it } from 'vitest';
import { matchCorrections } from './match';
import type { RawCorrection } from '@/types/review';

function raw(overrides: Partial<RawCorrection>): RawCorrection {
  return {
    original: '',
    corrected: '',
    type: 'grammar',
    explanation: 'test',
    severity: 1,
    contextBefore: '',
    ...overrides,
  };
}

describe('matchCorrections — PRD 8장 M2 필수 케이스', () => {
  it('1) original이 원문에 한 번만 등장 → 정확한 위치 매칭', () => {
    const text = 'Today I go to a cafe near my school.';
    const [c] = matchCorrections(text, [
      raw({ original: 'go', contextBefore: 'Today I ' }),
    ]);
    expect(c.matched).toBe(true);
    expect(text.slice(c.start!, c.end!)).toBe('go');
  });

  it('2) original("go")이 원문에 5번 등장 → contextBefore로 올바른 1개 특정', () => {
    const text = 'go go go go, but yesterday I go there again';
    const target = 'yesterday I ';
    const idx = text.indexOf(target) + target.length;
    const [c] = matchCorrections(text, [
      raw({ original: 'go', contextBefore: target }),
    ]);
    expect(c.matched).toBe(true);
    expect(c.start).toBe(idx);
  });

  it('3) contextBefore가 부정확 → 편집거리 최근접 후보 채택', () => {
    const text = 'I feel go. She will go. We must go now.';
    // 모델이 준 contextBefore가 실제("We must ")와 한 글자만 다름
    const [c] = matchCorrections(text, [
      raw({ original: 'go', contextBefore: 'We myst ' }),
    ]);
    const expectedIdx = text.indexOf('We must go') + 'We must '.length;
    expect(c.matched).toBe(true);
    expect(c.start).toBe(expectedIdx);
  });

  it('4) 원문에 스마트 따옴표, 모델은 ASCII → 정규화 후 매칭 성공', () => {
    const text = 'I don’t know what to say.';
    const [c] = matchCorrections(text, [
      raw({ original: "don't", contextBefore: 'I ' }),
    ]);
    expect(c.matched).toBe(true);
    expect(text.slice(c.start!, c.end!)).toBe('don’t');
  });

  it('5) 원문 여러 공백, 모델은 한 칸 → 정규화 후 매칭 성공', () => {
    const text = 'I  was   very    tired today.';
    const [c] = matchCorrections(text, [
      raw({ original: 'very tired', contextBefore: 'I was ' }),
    ]);
    expect(c.matched).toBe(true);
    expect(text.slice(c.start!, c.end!)).toBe('very    tired');
  });

  it('6) original이 원문에 아예 없음(모델 환각) → matched:false, 카드는 유지', () => {
    const text = 'Today was a good day.';
    const [c] = matchCorrections(text, [
      raw({ original: 'nonexistentword', contextBefore: 'Today was ' }),
    ]);
    expect(c.matched).toBe(false);
    expect(c.start).toBeNull();
    expect(c.end).toBeNull();
    // 카드 정보(original/corrected/explanation)는 그대로 보존된다
    expect(c.original).toBe('nonexistentword');
  });

  it('7) 두 오류 구간이 겹침 → 뒤 구간만 matched:false', () => {
    const text = 'I go to cafe yesterday.';
    const results = matchCorrections(text, [
      raw({ original: 'go to cafe', contextBefore: 'I ' }),
      raw({ original: 'cafe', contextBefore: 'go to ' }),
    ]);
    expect(results[0].matched).toBe(true);
    expect(results[1].matched).toBe(false);
    // 카드 자체는 유지된다
    expect(results[1].original).toBe('cafe');
  });

  it('8) 원문에 <script> 태그 텍스트가 포함되어도 위치는 정상 매칭된다 (이스케이프는 렌더 레이어 책임)', () => {
    const text = 'My note: <script>alert(1)</script> was in my old diary app.';
    const [c] = matchCorrections(text, [
      raw({ original: 'alert(1)', contextBefore: '<script>' }),
    ]);
    expect(c.matched).toBe(true);
    expect(text.slice(c.start!, c.end!)).toBe('alert(1)');
  });

  it('여러 오류가 있어도 반환 순서는 입력 순서를 유지한다', () => {
    const text = 'a b c';
    const results = matchCorrections(text, [
      raw({ original: 'c', contextBefore: 'a b ' }),
      raw({ original: 'a', contextBefore: '' }),
    ]);
    expect(results[0].original).toBe('c');
    expect(results[1].original).toBe('a');
  });
});
