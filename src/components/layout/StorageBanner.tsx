'use client';

import { useEffect, useState } from 'react';
import { isStorageAvailable, onStorageUnavailable } from '@/lib/storage';

export function StorageBanner() {
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!isStorageAvailable()) setUnavailable(true);
    return onStorageUnavailable(() => setUnavailable(true));
  }, []);

  if (!unavailable) return null;

  return (
    <div role="alert" className="bg-[var(--err-spelling-tint)] px-4 py-2 text-center text-xs font-medium text-[var(--err-spelling-strong)]">
      이 브라우저에서는 일기가 저장되지 않습니다. (시크릿 모드이거나 저장소가 차단되어 있어요)
    </div>
  );
}
