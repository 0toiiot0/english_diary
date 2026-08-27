'use client';

import type { DiaryEntry, Expression, SavedExpression, Settings } from '@/types/review';
import { STORAGE_KEYS, safeGetJSON, safeSetJSON, safeRemoveItem, type SetItemResult } from '@/lib/storage';

const DEFAULT_SETTINGS: Settings = {
  level: 'intermediate',
  onboarded: false,
  schemaVersion: 1,
};

export type StoreEvent = 'entries' | 'notes' | 'settings';

function emit(event: StoreEvent) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(`daynote:${event}-changed`));
}

export function onStoreChange(event: StoreEvent, listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => listener();
  window.addEventListener(`daynote:${event}-changed`, handler);
  return () => window.removeEventListener(`daynote:${event}-changed`, handler);
}

// ── 일기 (하루 1편, date가 PK — LS-03) ─────────────────────────────

export function getAllEntries(): DiaryEntry[] {
  return safeGetJSON<DiaryEntry[]>(STORAGE_KEYS.entries, []);
}

export function getEntry(date: string): DiaryEntry | undefined {
  return getAllEntries().find((e) => e.date === date);
}

export function saveEntry(entry: DiaryEntry): SetItemResult {
  const all = getAllEntries();
  const idx = all.findIndex((e) => e.date === entry.date);
  if (idx >= 0) {
    all[idx] = entry;
  } else {
    all.push(entry);
  }
  const result = safeSetJSON(STORAGE_KEYS.entries, all);
  emit('entries');
  return result;
}

export function deleteEntry(date: string): void {
  const all = getAllEntries().filter((e) => e.date !== date);
  safeSetJSON(STORAGE_KEYS.entries, all);
  emit('entries');
}

// ── 표현 노트 (NT-01~08) ────────────────────────────────────────────

function normalizeExpressionKey(expression: string): string {
  return expression.trim().toLowerCase();
}

export function getAllNotes(): SavedExpression[] {
  return safeGetJSON<SavedExpression[]>(STORAGE_KEYS.notes, []);
}

export function isExpressionSaved(expression: string): boolean {
  const key = normalizeExpressionKey(expression);
  return getAllNotes().some((n) => normalizeExpressionKey(n.expression) === key);
}

export function saveNote(expression: Expression, sourceDate: string): { ok: boolean; alreadySaved: boolean } {
  if (isExpressionSaved(expression.expression)) {
    return { ok: true, alreadySaved: true };
  }
  const notes = getAllNotes();
  const note: SavedExpression = {
    ...expression,
    savedAt: new Date().toISOString(),
    sourceDate,
  };
  notes.unshift(note);
  safeSetJSON(STORAGE_KEYS.notes, notes);
  emit('notes');
  return { ok: true, alreadySaved: false };
}

export function deleteNote(id: string): void {
  const notes = getAllNotes().filter((n) => n.id !== id);
  safeSetJSON(STORAGE_KEYS.notes, notes);
  emit('notes');
}

// ── 설정 (LV-01~05) ─────────────────────────────────────────────────

export function getSettings(): Settings {
  return safeGetJSON<Settings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
}

export function saveSettings(settings: Settings): void {
  safeSetJSON(STORAGE_KEYS.settings, settings);
  emit('settings');
}

// ── 작성 중 임시저장 (ED-03) ──────────────────────────────────────────

export interface Draft {
  date: string;
  title: string;
  body: string;
  savedAt: string;
}

export function getDraft(): Draft | null {
  return safeGetJSON<Draft | null>(STORAGE_KEYS.draft, null);
}

export function saveDraft(draft: Draft): void {
  safeSetJSON(STORAGE_KEYS.draft, draft);
}

export function clearDraft(): void {
  safeRemoveItem(STORAGE_KEYS.draft);
}

// ── 전체 데이터 내보내기 / 가져오기 (DM-01, DM-02) ───────────────────

export interface ExportedData {
  schemaVersion: 1;
  exportedAt: string;
  entries: DiaryEntry[];
  notes: SavedExpression[];
  settings: Settings;
}

export function exportAllData(): ExportedData {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    entries: getAllEntries(),
    notes: getAllNotes(),
    settings: getSettings(),
  };
}

export function importAllData(json: string): { ok: true } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: '올바른 JSON 파일이 아니에요.' };
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !Array.isArray((parsed as ExportedData).entries) ||
    !Array.isArray((parsed as ExportedData).notes) ||
    typeof (parsed as ExportedData).settings !== 'object'
  ) {
    return { ok: false, error: '내보내기 파일 형식과 달라요.' };
  }
  const data = parsed as ExportedData;
  safeSetJSON(STORAGE_KEYS.entries, data.entries);
  safeSetJSON(STORAGE_KEYS.notes, data.notes);
  safeSetJSON(STORAGE_KEYS.settings, data.settings);
  emit('entries');
  emit('notes');
  emit('settings');
  return { ok: true };
}

export function clearAllData(): void {
  safeRemoveItem(STORAGE_KEYS.entries);
  safeRemoveItem(STORAGE_KEYS.notes);
  safeRemoveItem(STORAGE_KEYS.settings);
  safeRemoveItem(STORAGE_KEYS.draft);
  emit('entries');
  emit('notes');
  emit('settings');
}
