'use client';

import { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '@/lib/store';
import type { Level } from '@/types/review';

const LEVEL_OPTIONS: Array<{ value: Level; label: string; desc: string }> = [
  { value: 'beginner', label: '초급', desc: '문법 용어 없이 예시로 설명해줘요' },
  { value: 'intermediate', label: '중급', desc: '문법 용어 + 구동사·관용구 위주' },
  { value: 'advanced', label: '고급', desc: '뉘앙스·문체까지 짚어줘요' },
];

export function OnboardingModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!getSettings().onboarded);
  }, []);

  function finish(level?: Level) {
    const current = getSettings();
    saveSettings({ ...current, level: level ?? current.level, onboarded: true });
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="영어 수준 선택" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] bg-surface p-5 shadow-lg">
        <p className="text-base font-semibold text-text-primary">지금 영어 수준은 어느 정도인가요?</p>
        <p className="mt-1 text-sm text-text-secondary">첨삭 설명과 추천 표현의 난이도가 달라져요. 나중에 설정에서 바꿀 수 있어요.</p>
        <div className="mt-4 space-y-2">
          {LEVEL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => finish(opt.value)}
              className="min-h-11 w-full rounded-[var(--radius-button)] border border-border px-3 py-2 text-left hover:border-accent hover:bg-accent-soft"
            >
              <span className="text-sm font-semibold text-text-primary">{opt.label}</span>
              <span className="ml-2 text-xs text-text-tertiary">{opt.desc}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => finish()}
          className="mt-4 min-h-11 w-full text-sm text-text-tertiary underline underline-offset-4"
        >
          건너뛰기 (기본값: 중급)
        </button>
      </div>
    </div>
  );
}
