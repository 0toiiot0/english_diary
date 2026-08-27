export type Level = 'beginner' | 'intermediate' | 'advanced';
export type ErrorType = 'spelling' | 'grammar' | 'natural' | 'punctuation';
export type Register = 'casual' | 'neutral' | 'formal';

/** 모델이 반환하는 원본 오류 */
export interface RawCorrection {
  original: string;
  corrected: string;
  type: ErrorType;
  explanation: string; // 한국어
  severity: 1 | 2 | 3;
  contextBefore: string;
}

/** 위치 매칭까지 끝난, 화면이 실제로 소비하는 오류 */
export interface Correction extends RawCorrection {
  id: string; // 클라이언트/서버에서 생성 (카드↔하이라이트 연결 키)
  matched: boolean; // false면 카드만 표시, 하이라이트 없음 (CR-07)
  start: number | null; // 원문 문자 인덱스
  end: number | null;
}

export interface Expression {
  id: string;
  expression: string;
  meaningKo: string;
  kind: 'idiom' | 'phrase';
  register: Register;
  sourceSentence: string;
  rewritten: string;
}

export interface ReviewResult {
  corrections: Correction[];
  expressions: Expression[];
  praise: string;
  reviewedAt: string; // ISO
  level: Level;
  model: string; // 재현성 확인용
  textHash: string; // 동일 본문 재요청 차단 (5.5)
  unmatchedCount: number; // 매칭 실패 수 (품질 모니터링)
}

export interface DiaryEntry {
  date: string; // 'YYYY-MM-DD' — 하루 1편, 이것이 사실상 PK (LS-03)
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  review: ReviewResult | null; // 첨삭 전이면 null
}

export interface SavedExpression extends Expression {
  savedAt: string;
  sourceDate: string; // 이 표현을 발견한 일기 날짜 (NT-03)
}

export interface Settings {
  level: Level;
  onboarded: boolean;
  schemaVersion: 1;
}

export type ErrorCode =
  | 'NETWORK'
  | 'AUTH'
  | 'RATE_LIMIT'
  | 'SCHEMA'
  | 'TIMEOUT'
  | 'TOO_LONG'
  | 'SERVER';

export interface ApiErrorBody {
  code: ErrorCode;
  message: string;
}

/** POST /api/review 요청 바디 */
export interface ReviewRequest {
  text: string;
  level: Level;
}

/** POST /api/review 성공 응답 바디 */
export interface ReviewResponse {
  corrections: Correction[];
  expressions: Expression[];
  praise: string;
  reviewedAt: string;
  level: Level;
  model: string;
  textHash: string;
  unmatchedCount: number;
}
