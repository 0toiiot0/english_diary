'use client';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'daynote:v1:theme';

/** layout.tsx의 beforeInteractive 스크립트와 반드시 동일한 로직을 유지해야 한다 (깜빡임 방지). */
export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return raw === 'dark' || raw === 'light' ? raw : null;
  } catch {
    return null;
  }
}

export function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getEffectiveTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // 저장이 안 되어도(시크릿 모드 등) 이번 세션에서는 화면에는 반영된 상태를 유지한다.
  }
}

/** layout.tsx의 인라인 스크립트와 동일한 문자열 — 파일 하나로 관리하기 위해 여기서 만들어 심는다. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=window.localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;
