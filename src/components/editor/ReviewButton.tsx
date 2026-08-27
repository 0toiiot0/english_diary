'use client';

export function ReviewButton({
  label,
  disabled,
  loading,
  onClick,
}: {
  label: string;
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="min-h-11 w-full rounded-[var(--radius-button)] bg-accent px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40 md:w-auto md:min-w-48"
    >
      {loading ? '첨삭하는 중…' : label}
    </button>
  );
}
