'use client';

/**
 * localStorage 안전 래퍼 (PRD 5.7).
 * 시크릿 모드·쿠키 차단 환경에서는 localStorage 접근 자체가 예외를 던질 수 있다.
 * 조용히 실패하면 사용자는 글을 잃고도 알 수 없다 — 반드시 감지해서 알린다.
 */

export const STORAGE_KEYS = {
  entries: 'daynote:v1:entries',
  notes: 'daynote:v1:notes',
  settings: 'daynote:v1:settings',
  draft: 'daynote:v1:draft',
} as const;

let available: boolean | null = null;
const memoryFallback = new Map<string, string>();
const unavailableListeners = new Set<() => void>();

function notifyUnavailable() {
  for (const listener of unavailableListeners) listener();
}

export function onStorageUnavailable(listener: () => void): () => void {
  unavailableListeners.add(listener);
  return () => unavailableListeners.delete(listener);
}

export function isStorageAvailable(): boolean {
  if (available !== null) return available;
  try {
    const testKey = '__daynote_probe__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    available = true;
  } catch {
    available = false;
    notifyUnavailable();
  }
  return available;
}

export function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  if (!isStorageAvailable()) return memoryFallback.get(key) ?? null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memoryFallback.get(key) ?? null;
  }
}

export type SetItemResult = 'ok' | 'quota_exceeded' | 'unavailable';

export function safeSetItem(key: string, value: string): SetItemResult {
  if (typeof window === 'undefined') return 'unavailable';
  if (!isStorageAvailable()) {
    memoryFallback.set(key, value);
    return 'unavailable';
  }
  try {
    window.localStorage.setItem(key, value);
    return 'ok';
  } catch (err) {
    memoryFallback.set(key, value);
    if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)) {
      return 'quota_exceeded';
    }
    return 'unavailable';
  }
}

export function safeRemoveItem(key: string): void {
  if (typeof window === 'undefined') return;
  memoryFallback.delete(key);
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // 무시 — 이미 memoryFallback에서 제거됨
  }
}

export function safeGetJSON<T>(key: string, fallback: T): T {
  const raw = safeGetItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeSetJSON<T>(key: string, value: T): SetItemResult {
  return safeSetItem(key, JSON.stringify(value));
}

/** 대략적인 localStorage 사용량(바이트) 및 5MB 기준 사용률 (DM-05) */
export function estimateStorageUsage(): { bytes: number; ratio: number } {
  if (typeof window === 'undefined' || !isStorageAvailable()) return { bytes: 0, ratio: 0 };
  let bytes = 0;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      const value = window.localStorage.getItem(key) ?? '';
      bytes += key.length + value.length;
    }
  } catch {
    return { bytes: 0, ratio: 0 };
  }
  const LIMIT_BYTES = 5 * 1024 * 1024;
  return { bytes, ratio: bytes / LIMIT_BYTES };
}
