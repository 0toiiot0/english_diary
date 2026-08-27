'use client';

import { useEffect, useRef, useState } from 'react';
import { getSettings, saveSettings, exportAllData, importAllData, clearAllData } from '@/lib/store';
import { estimateStorageUsage } from '@/lib/storage';
import type { Level, Settings } from '@/types/review';

const LEVEL_OPTIONS: Array<{ value: Level; label: string }> = [
  { value: 'beginner', label: '초급' },
  { value: 'intermediate', label: '중급' },
  { value: 'advanced', label: '고급' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [usage, setUsage] = useState({ bytes: 0, ratio: 0 });
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [deleteStep, setDeleteStep] = useState(0); // 0: idle, 1: 1차 확인, 2: 완료
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettings(getSettings());
    setUsage(estimateStorageUsage());
  }, []);

  if (!settings) {
    return <div className="skeleton h-40 rounded-[var(--radius-card)]" aria-hidden />;
  }

  function changeLevel(level: Level) {
    const next = { ...settings!, level };
    saveSettings(next);
    setSettings(next);
  }

  function handleExport() {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daynote-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(file: File) {
    const text = await file.text();
    const result = importAllData(text);
    if (result.ok) {
      setImportMessage('가져오기가 완료됐어요.');
      setSettings(getSettings());
      setUsage(estimateStorageUsage());
    } else {
      setImportMessage(result.error);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-text-primary md:text-[28px]">설정</h1>

      <section className="mt-6 rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-text-primary">영어 수준</h2>
        <p className="mt-1 text-xs text-text-secondary">첨삭 설명과 추천 표현의 난이도가 달라져요.</p>
        <div className="mt-3 flex gap-2">
          {LEVEL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => changeLevel(opt.value)}
              aria-pressed={settings.level === opt.value}
              className={`min-h-11 flex-1 rounded-[var(--radius-button)] border px-3 text-sm font-medium ${
                settings.level === opt.value
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-border text-text-secondary hover:bg-accent-soft/60'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-text-primary">데이터 관리</h2>
        <p className="mt-1 text-xs leading-relaxed text-text-secondary">
          이 일기는 이 브라우저에만 저장됩니다. 브라우저 데이터를 지우면 사라집니다.
        </p>
        <p className="mt-1 text-xs leading-relaxed text-text-secondary">
          첨삭 요청 시 일기 본문이 Anthropic API로 전송됩니다. 저희 서버에는 저장되지 않습니다.
        </p>

        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-skeleton">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.min(100, Math.round(usage.ratio * 100))}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-text-tertiary">
            약 {(usage.bytes / 1024).toFixed(0)}KB 사용 중 ({Math.round(usage.ratio * 100)}%)
          </p>
          {usage.ratio > 0.8 && (
            <p className="mt-1 text-xs font-medium text-[var(--err-spelling-strong)]">
              저장 공간이 거의 찼어요. 내보내기로 백업해두는 걸 추천해요.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="min-h-11 rounded-[var(--radius-button)] border border-border px-4 text-sm font-medium text-text-secondary hover:bg-accent-soft"
          >
            전체 데이터 내보내기 (JSON)
          </button>
          <button
            type="button"
            onClick={handleImportClick}
            className="min-h-11 rounded-[var(--radius-button)] border border-border px-4 text-sm font-medium text-text-secondary hover:bg-accent-soft"
          >
            가져오기
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = '';
            }}
          />
        </div>
        {importMessage && <p className="mt-2 text-xs text-text-secondary">{importMessage}</p>}
      </section>

      <section className="mt-4 rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold text-text-primary">전체 데이터 삭제</h2>
        <p className="mt-1 text-xs text-text-secondary">모든 일기, 첨삭 결과, 표현 노트가 삭제돼요. 되돌릴 수 없어요.</p>
        {deleteStep === 0 && (
          <button
            type="button"
            onClick={() => setDeleteStep(1)}
            className="mt-3 min-h-11 rounded-[var(--radius-button)] border border-border px-4 text-sm font-medium text-text-secondary hover:bg-accent-soft"
          >
            전체 삭제
          </button>
        )}
        {deleteStep === 1 && (
          <div className="mt-3 rounded-[var(--radius-badge)] border border-border bg-accent-soft p-3">
            <p className="text-sm font-medium text-text-primary">정말 삭제할까요? 이 작업은 되돌릴 수 없어요.</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteStep(0)}
                className="min-h-11 rounded-[var(--radius-button)] px-4 text-sm text-text-secondary hover:bg-surface"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllData();
                  setSettings(getSettings());
                  setUsage(estimateStorageUsage());
                  setDeleteStep(0);
                  setImportMessage('전체 데이터가 삭제됐어요.');
                }}
                className="min-h-11 rounded-[var(--radius-button)] bg-accent px-4 text-sm font-semibold text-white"
              >
                네, 삭제할게요
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
