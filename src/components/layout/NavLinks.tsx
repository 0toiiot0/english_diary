'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: '오늘' },
  { href: '/diary', label: '일기 목록' },
  { href: '/notes', label: '표현 노트' },
  { href: '/settings', label: '설정' },
] as const;

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

export function NavLinks({ variant }: { variant: 'top' | 'bottom' }) {
  const pathname = usePathname();

  if (variant === 'bottom') {
    return (
      <nav
        aria-label="주요 메뉴"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs',
                'min-h-[44px]',
                active ? 'text-accent-text font-semibold' : 'text-text-tertiary',
              ].join(' ')}
              aria-current={active ? 'page' : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="주요 메뉴" className="hidden items-center gap-1 md:flex">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'rounded-[var(--radius-button)] px-3 py-2 text-sm font-medium',
              active ? 'bg-accent-soft text-accent-text' : 'text-text-secondary hover:bg-accent-soft/60',
            ].join(' ')}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
