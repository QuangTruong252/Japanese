'use client';

import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { CloudCheck, CloudOff, CloudUpload } from 'lucide-react';
import { db } from '@/lib/db';
import {
  getSyncStatusSnapshot,
  getServerSyncStatusSnapshot,
  subscribeSyncStatus,
  triggerSync,
  type SyncState,
} from '@/lib/sync';
import { cn } from '@/lib/utils';

interface SyncBadgeProps {
  className?: string;
  showTextOnMobile?: boolean;
  state?: SyncState;
}

const VARIANTS: Record<
  SyncState,
  { label: (n: number) => string; className: string }
> = {
  synced: {
    label: () => 'Đã đồng bộ',
    className: 'bg-success/10 text-success border-success/20 hover:bg-success/15',
  },
  pending: {
    label: (n) => `Chờ đồng bộ (${n})`,
    className: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/15',
  },
  syncing: {
    label: () => 'Đang đồng bộ…',
    className: 'bg-warning/10 text-warning border-warning/20 animate-pulse',
  },
  offline: {
    label: () => 'Ngoại tuyến — đã lưu trên máy',
    className: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
  },
  unconfigured: {
    label: () => 'Đã lưu trên máy',
    className: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
  },
};

export function SyncBadge({ className, showTextOnMobile = false, state }: SyncBadgeProps) {
  const router = useRouter();
  const dexiePendingCount = useLiveQuery(() => db.pendingSync.count(), []) ?? 0;

  const engineStatus = useSyncExternalStore(
    subscribeSyncStatus,
    getSyncStatusSnapshot,
    getServerSyncStatusSnapshot,
  );

  const resolvedState: SyncState =
    state ??
    (engineStatus.state === 'syncing'
      ? 'syncing'
      : dexiePendingCount > 0
        ? 'pending'
        : engineStatus.state);

  const pendingCount = Math.max(dexiePendingCount, engineStatus.pendingCount);
  const variant = VARIANTS[resolvedState] ?? VARIANTS.offline;
  const label = variant.label(pendingCount);

  const handleClick = async () => {
    if (resolvedState === 'offline' || resolvedState === 'unconfigured') {
      router.push('/cai-dat');
      return;
    }
    await triggerSync();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors select-none cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px',
        variant.className,
        className,
      )}
      aria-label={label}
      title={label}
    >
      {resolvedState === 'synced' && (
        <CloudCheck className="size-3.5 shrink-0" aria-hidden="true" />
      )}
      {(resolvedState === 'pending' || resolvedState === 'syncing') && (
        <CloudUpload
          className={cn(
            'size-3.5 shrink-0',
            resolvedState === 'syncing' && 'motion-safe:animate-spin',
          )}
          aria-hidden="true"
        />
      )}
      {(resolvedState === 'offline' || resolvedState === 'unconfigured') && (
        <CloudOff className="size-3.5 shrink-0" aria-hidden="true" />
      )}
      <span className={cn('whitespace-nowrap', !showTextOnMobile && 'hidden sm:inline')}>
        {label}
      </span>
    </button>
  );
}
