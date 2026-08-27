import Link from 'next/link';
import { StreakBadge } from '@/components/streak/StreakBadge';
import { NavLinks } from '@/components/layout/NavLinks';

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-serif text-lg font-semibold text-text-primary">
            DayNote
          </Link>
          <StreakBadge />
        </div>
        <NavLinks variant="top" />
      </div>
    </header>
  );
}
