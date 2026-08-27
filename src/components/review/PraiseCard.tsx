export function PraiseCard({ praise }: { praise: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-accent-soft bg-accent-soft p-5 text-center">
      <p className="text-base font-semibold text-accent">이번 일기에서는 고칠 곳을 찾지 못했어요 👏</p>
      <p className="mt-2 text-sm text-text-secondary">{praise}</p>
    </div>
  );
}
