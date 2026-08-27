import { z } from 'zod';

/**
 * 모델의 submit_review tool_use.input을 검증하는 스키마.
 * expressions가 3개 미만이어도 스키마 실패로 보지 않는다 (ER-13) —
 * 억지로 5개를 채우게 하는 것보다 짧은 일기에서는 적게 나오는 게 낫다.
 * 여기서는 최소 0개만 강제하고, "부분 성공" 판정은 route handler에서 한다.
 */

export const rawCorrectionSchema = z.object({
  original: z.string().min(1),
  corrected: z.string(),
  type: z.enum(['spelling', 'grammar', 'natural', 'punctuation']),
  explanation: z.string().min(1),
  severity: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  contextBefore: z.string(),
});

export const expressionSchema = z.object({
  expression: z.string().min(1),
  meaningKo: z.string().min(1),
  kind: z.enum(['idiom', 'phrase']),
  register: z.enum(['casual', 'neutral', 'formal']),
  sourceSentence: z.string().min(1),
  rewritten: z.string().min(1),
});

export const submitReviewSchema = z.object({
  corrections: z.array(rawCorrectionSchema).max(60),
  expressions: z.array(expressionSchema).max(5),
  praise: z.string().min(1),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
export type RawCorrectionInput = z.infer<typeof rawCorrectionSchema>;
export type ExpressionInput = z.infer<typeof expressionSchema>;
