import type { Correction, RawCorrection } from '@/types/review';

/**
 * 위치 매칭 (PRD 5.6) — 모델이 준 오류 문자열이 원문의 몇 번째 글자인지 찾는다.
 * 모델에게 문자 인덱스를 직접 물어보지 않는 이유: LLM은 글자 수를 정확히 세지 못한다.
 *
 * 단계:
 * 1) contextBefore + original 정확 매칭
 * 2) contextBefore 없이 original만으로 재시도 (여러 개면 contextBefore와 편집거리 최근접 채택)
 * 3) 공백 정규화 / 스마트 따옴표·대시 정규화 후 재시도 (원본 인덱스로 역매핑)
 * 4) 대소문자 무시 재시도
 * 5) 그래도 못 찾으면 matched:false (카드는 버리지 않는다, CR-07)
 */

interface MatchPosition {
  start: number;
  end: number;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

function findAllOccurrences(haystack: string, needle: string): number[] {
  if (needle.length === 0) return [];
  const indices: number[] = [];
  let from = 0;
  for (;;) {
    const idx = haystack.indexOf(needle, from);
    if (idx === -1) break;
    indices.push(idx);
    from = idx + 1;
  }
  return indices;
}

/** 정규화된 문자와 원본 문자 범위를 함께 추적한다 (역매핑용). */
interface NormalizedText {
  normalized: string;
  starts: number[]; // starts[i] = normalized[i]를 만든 원문 구간의 시작 인덱스
  ends: number[]; // ends[i]   = normalized[i]를 만든 원문 구간의 끝(배타적) 인덱스
}

const SMART_QUOTE_MAP: Record<string, string> = {
  '‘': "'",
  '’': "'",
  '“': '"',
  '”': '"',
  '–': '-',
  '—': '-',
};

function normalizeWithMap(text: string): NormalizedText {
  const normalized: string[] = [];
  const starts: number[] = [];
  const ends: number[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      let j = i;
      while (j < text.length && /\s/.test(text[j])) j++;
      normalized.push(' ');
      starts.push(i);
      ends.push(j);
      i = j;
      continue;
    }
    const mapped = SMART_QUOTE_MAP[ch];
    normalized.push(mapped ?? ch);
    starts.push(i);
    ends.push(i + 1);
    i += 1;
  }
  return { normalized: normalized.join(''), starts, ends };
}

/** 매핑 없이 문자열만 정규화 (모델이 준 needle 정규화용) */
function normalizePlain(text: string): string {
  return normalizeWithMap(text).normalized;
}

function exactMatch(text: string, contextBefore: string, original: string): MatchPosition | null {
  const needle = contextBefore + original;
  const idx = text.indexOf(needle);
  if (idx === -1) return null;
  const start = idx + contextBefore.length;
  return { start, end: start + original.length };
}

function occurrenceMatch(
  text: string,
  contextBefore: string,
  original: string
): MatchPosition | null {
  const occurrences = findAllOccurrences(text, original);
  if (occurrences.length === 0) return null;
  if (occurrences.length === 1) {
    const start = occurrences[0];
    return { start, end: start + original.length };
  }
  // 여러 개면 contextBefore와의 편집거리가 가장 가까운 후보를 채택한다.
  let best = occurrences[0];
  let bestDistance = Infinity;
  for (const idx of occurrences) {
    const precedingLen = Math.min(contextBefore.length, idx);
    const preceding = text.slice(idx - precedingLen, idx);
    const distance = levenshtein(preceding, contextBefore);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = idx;
    }
  }
  return { start: best, end: best + original.length };
}

function normalizedMatch(
  text: string,
  contextBefore: string,
  original: string,
  caseInsensitive: boolean
): MatchPosition | null {
  const haystack = normalizeWithMap(caseInsensitive ? text.toLowerCase() : text);
  const normContextBefore = normalizePlain(
    caseInsensitive ? contextBefore.toLowerCase() : contextBefore
  );
  const normOriginal = normalizePlain(caseInsensitive ? original.toLowerCase() : original);
  const needle = normContextBefore + normOriginal;

  let normStart = -1;
  if (needle.length > 0) {
    const idx = haystack.normalized.indexOf(needle);
    if (idx !== -1) normStart = idx + normContextBefore.length;
  }

  if (normStart === -1) {
    // contextBefore 없이 정규화된 original만으로 재시도
    const idx = haystack.normalized.indexOf(normOriginal);
    if (idx === -1) return null;
    normStart = idx;
  }

  const normEnd = normStart + normOriginal.length;
  if (normOriginal.length === 0 || normEnd > haystack.starts.length) return null;

  const start = haystack.starts[normStart];
  const end = haystack.ends[normEnd - 1];
  return { start, end };
}

function locate(text: string, contextBefore: string, original: string): MatchPosition | null {
  if (!original) return null;

  const exact = exactMatch(text, contextBefore, original);
  if (exact) return exact;

  const byOccurrence = occurrenceMatch(text, contextBefore, original);
  if (byOccurrence) return byOccurrence;

  const normalized = normalizedMatch(text, contextBefore, original, false);
  if (normalized) return normalized;

  const caseInsensitive = normalizedMatch(text, contextBefore, original, true);
  if (caseInsensitive) return caseInsensitive;

  return null;
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * 원문과 모델이 준 오류 목록으로부터, 위치가 매칭된 Correction[]을 만든다.
 * 겹치는 구간은 뒤쪽(정렬 후 나중에 오는 것)을 matched:false로 강등한다 —
 * 카드 자체는 버리지 않는다 (CR-07 원칙 동일 적용).
 */
export function matchCorrections(text: string, corrections: RawCorrection[]): Correction[] {
  // 원래 순서를 유지한 채로 반환한다. 겹침 처리는 이 배열의 객체를 직접 갱신한다.
  const results: Correction[] = corrections.map((c) => {
    const pos = locate(text, c.contextBefore, c.original);
    return {
      ...c,
      id: makeId(),
      matched: pos !== null,
      start: pos?.start ?? null,
      end: pos?.end ?? null,
    };
  });

  const matched = results.filter((c) => c.matched && c.start !== null && c.end !== null);
  matched.sort((a, b) => {
    if (a.start! !== b.start!) return a.start! - b.start!;
    return b.end! - b.start! - (a.end! - a.start!); // 길이 내림차순
  });

  const accepted: Array<{ start: number; end: number }> = [];
  for (const c of matched) {
    const overlaps = accepted.some((r) => c.start! < r.end && r.start < c.end!);
    if (overlaps) {
      c.matched = false;
      c.start = null;
      c.end = null;
    } else {
      accepted.push({ start: c.start!, end: c.end! });
    }
  }

  return results;
}
