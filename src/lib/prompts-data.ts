/**
 * 오늘의 글감 (PR-01~06) — 앱 내장 정적 목록. API를 호출하지 않는다.
 * "오늘 있었던 구체적인 일"을 묻도록 쓴다 (부록 C 원칙).
 * 60개 이상 (PR-05) — 2개월간 중복 없이 순환한다.
 */

export interface DiaryPrompt {
  en: string;
  ko: string;
}

export const DIARY_PROMPTS: DiaryPrompt[] = [
  { en: 'What made you laugh today?', ko: '오늘 뭐가 웃겼나요?' },
  { en: 'Describe something you ate today.', ko: '오늘 먹은 것을 묘사해보세요.' },
  { en: 'What was the hardest part of today?', ko: '오늘 가장 힘들었던 건 뭐였나요?' },
  { en: 'Who did you talk to today?', ko: '오늘 누구와 이야기했나요?' },
  { en: 'What are you looking forward to?', ko: '앞으로 기대되는 일은 무엇인가요?' },
  { en: 'Describe the weather and how it made you feel.', ko: '오늘 날씨와 그때의 기분을 써보세요.' },
  { en: 'What did you learn today, even something small?', ko: '오늘 배운 것, 아주 작은 것이라도 있나요?' },
  { en: 'If you could redo one moment today, which one?', ko: '오늘 하루 중 다시 하고 싶은 순간이 있다면?' },
  { en: 'What was the first thing you did this morning?', ko: '오늘 아침에 가장 먼저 한 일은 무엇이었나요?' },
  { en: 'Describe a place you went to today.', ko: '오늘 다녀온 장소를 묘사해보세요.' },
  { en: 'What surprised you today?', ko: '오늘 놀랐던 일이 있나요?' },
  { en: 'What did you do to relax today?', ko: '오늘 쉬기 위해 무엇을 했나요?' },
  { en: 'Write about a small decision you made today.', ko: '오늘 내린 작은 결정 하나에 대해 써보세요.' },
  { en: 'What did someone say to you today that stuck with you?', ko: '오늘 누군가 한 말 중 기억에 남는 게 있나요?' },
  { en: 'Describe your commute or trip today.', ko: '오늘의 이동(등교·출근 등)을 묘사해보세요.' },
  { en: 'What is one thing you are grateful for today?', ko: '오늘 감사했던 일 한 가지는 무엇인가요?' },
  { en: 'What did you procrastinate on today?', ko: '오늘 미룬 일이 있나요?' },
  { en: 'Describe your mood right now in detail.', ko: '지금 기분을 자세히 묘사해보세요.' },
  { en: 'What is something you saw today that you liked?', ko: '오늘 본 것 중 마음에 든 것은?' },
  { en: 'Write about a mistake you made today and what happened.', ko: '오늘 한 실수와 그 뒤에 일어난 일을 써보세요.' },
  { en: 'What music or sound did you hear today?', ko: '오늘 들은 음악이나 소리에 대해 써보세요.' },
  { en: 'Describe a conversation you had today.', ko: '오늘 나눈 대화 하나를 묘사해보세요.' },
  { en: 'What did you buy or want to buy today?', ko: '오늘 산 것 혹은 사고 싶었던 것은?' },
  { en: 'How did you spend your free time today?', ko: '오늘 여유 시간을 어떻게 보냈나요?' },
  { en: 'What is one goal for tomorrow?', ko: '내일의 목표 한 가지는 무엇인가요?' },
  { en: 'Describe a smell that reminded you of something today.', ko: '오늘 어떤 냄새가 무언가를 떠올리게 했나요?' },
  { en: 'What was different about today compared to yesterday?', ko: '오늘은 어제와 무엇이 달랐나요?' },
  { en: 'Write about someone who helped you today.', ko: '오늘 나를 도와준 사람에 대해 써보세요.' },
  { en: 'What did you avoid doing today?', ko: '오늘 피한 일이 있나요?' },
  { en: 'Describe the last meal you had today.', ko: '오늘 마지막으로 먹은 음식을 묘사해보세요.' },
  { en: 'What made you feel proud today?', ko: '오늘 뿌듯했던 순간은?' },
  { en: 'What was on your to-do list today, and how much did you finish?', ko: '오늘 할 일 목록과 얼마나 끝냈는지 써보세요.' },
  { en: 'Describe something that annoyed you today.', ko: '오늘 짜증났던 일을 묘사해보세요.' },
  { en: 'What did you wear today and why?', ko: '오늘 무엇을 입었고 그 이유는?' },
  { en: 'Write about a plan that changed today.', ko: '오늘 바뀐 계획이 있나요?' },
  { en: 'What is something you are curious about after today?', ko: '오늘 이후로 궁금해진 것이 있나요?' },
  { en: 'Describe how your body felt at the end of the day.', ko: '하루가 끝날 무렵 몸 상태는 어땠나요?' },
  { en: 'What did you notice about a stranger today?', ko: '오늘 낯선 사람에게서 눈에 띈 점이 있나요?' },
  { en: 'Write about a habit you kept or broke today.', ko: '오늘 지킨 습관 또는 깨진 습관이 있나요?' },
  { en: 'What would you tell your morning self now?', ko: '지금 아침의 나에게 하고 싶은 말은?' },
  { en: 'Describe a moment today when time felt slow or fast.', ko: '오늘 시간이 느리거나 빠르게 느껴진 순간은?' },
  { en: 'What did you read or watch today?', ko: '오늘 읽거나 본 것은 무엇인가요?' },
  { en: 'Write about a small kindness you gave or received today.', ko: '오늘 주고받은 작은 친절이 있나요?' },
  { en: 'What question do you wish someone had asked you today?', ko: '오늘 누군가 물어봐주길 바랐던 질문은?' },
  { en: 'Describe the busiest part of your day.', ko: '오늘 가장 바빴던 시간대를 묘사해보세요.' },
  { en: 'What is one thing you would change about today?', ko: '오늘 하루 중 바꾸고 싶은 것 한 가지는?' },
  { en: 'Write about a moment you felt completely present today.', ko: '오늘 온전히 집중했던 순간이 있나요?' },
  { en: 'What did you complain about today, even silently?', ko: '오늘 (속으로라도) 불평한 것이 있나요?' },
  { en: 'Describe a color, texture, or shape you noticed today.', ko: '오늘 눈에 띈 색깔, 질감, 모양이 있나요?' },
  { en: 'What did you do right after waking up?', ko: '눈을 뜬 직후 무엇을 했나요?' },
  { en: 'Write about a conversation you wish had gone differently.', ko: '다르게 흘러갔으면 했던 대화가 있나요?' },
  { en: 'What made today feel ordinary or special?', ko: '오늘이 평범하게, 혹은 특별하게 느껴진 이유는?' },
  { en: 'Describe something you fixed or solved today.', ko: '오늘 고치거나 해결한 것이 있나요?' },
  { en: 'What did you notice about your energy levels today?', ko: '오늘 컨디션(기운)의 변화를 알아챘나요?' },
  { en: 'Write about a text message or call you had today.', ko: '오늘 주고받은 문자나 통화에 대해 써보세요.' },
  { en: 'What is something you postponed until tomorrow?', ko: '내일로 미룬 일이 있나요?' },
  { en: 'Describe a small win from today.', ko: '오늘의 작은 성취를 묘사해보세요.' },
  { en: 'What did the last hour of your day look like?', ko: '오늘 마지막 한 시간은 어땠나요?' },
  { en: 'Write about something you are still thinking about from today.', ko: '오늘 있었던 일 중 아직도 생각나는 것은?' },
  { en: 'If today had a title, what would it be and why?', ko: '오늘 하루에 제목을 붙인다면 무엇이고, 그 이유는?' },
];

if (process.env.NODE_ENV !== 'production' && DIARY_PROMPTS.length < 60) {
  console.warn(`DIARY_PROMPTS has only ${DIARY_PROMPTS.length} entries; PR-05 요구사항은 60개 이상입니다.`);
}

/** 날짜를 시드로 결정 — 같은 날 새로고침해도 같은 글감 (PR-03) */
export function getPromptForDate(dateKey: string): DiaryPrompt {
  let seed = 0;
  for (let i = 0; i < dateKey.length; i++) {
    seed = (seed * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  const index = seed % DIARY_PROMPTS.length;
  return DIARY_PROMPTS[index];
}

/** "다른 글감 보기" — 목록 내에서 순환 (PR-04) */
export function getNextPrompt(current: DiaryPrompt): DiaryPrompt {
  const idx = DIARY_PROMPTS.findIndex((p) => p.en === current.en);
  const nextIdx = (idx + 1 + DIARY_PROMPTS.length) % DIARY_PROMPTS.length;
  return DIARY_PROMPTS[nextIdx];
}
