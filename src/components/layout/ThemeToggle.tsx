'use client';

import { useEffect, useState } from 'react';
import { applyTheme, getEffectiveTheme, type Theme } from '@/lib/theme';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // layout.tsx의 beforeInteractive 스크립트가 이미 <html data-theme>를 정해뒀다 —
    // 그 결과를 그대로 읽어 React state를 맞춘다 (다시 계산하지 않음, 깜빡임 방지).
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' || current === 'light' ? current : getEffectiveTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
      className="flex h-11 w-11 items-center justify-center rounded-full text-lg text-text-secondary hover:bg-accent-soft"
    >
      {theme === null ? null : theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
