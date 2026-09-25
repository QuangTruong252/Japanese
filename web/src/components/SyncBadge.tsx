'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
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
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { resolveSyncBadgeState } from '@/lib/stats';
import { cn } from '@/lib/utils';

interface SyncBadgeProps {
  className?: string;
  showTextOnMobile?: boolean;
  state?: SyncState;
  isLoggedIn?: boolean;
}

const VARIANTS: Record<
  SyncState,
  { className: string }
> = {
  synced: {
    className: 'bg-success/10 text-success border-success/20 hover:bg-success/15',
  },
  pending: {
    className: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/15',
  },
  syncing: {
    className: 'bg-warning/10 text-warning border-warning/20 animate-pulse',
  },
  offline: {
    className: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
  },
  unconfigured: {
    className: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
  },
};

export function SyncBadge({
  className,
  showTextOnMobile = false,
  state,
  isLoggedIn: isLoggedInProp,
}: SyncBadgeProps) {
  const router = useRouter();
  const dexiePendingCount = useLiveQuery(() => db.pendingSync.count(), []) ?? 0;

  const [internalLoggedIn, setInternalLoggedIn] = useState(false);
  const isLoggedIn = isLoggedInProp !== undefined ? isLoggedInProp : internalLoggedIn;

  useEffect(() => {
    if (isLoggedInProp !== undefined) return;
    if (!isSupabaseConfigured()) {
      return;
    }
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        setInternalLoggedIn(Boolean(user));
      });
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setInternalLoggedIn(Boolean(session?.user));
      });
      return () => subscription.unsubscribe();
    } catch {
      // Supabase unconfigured / unavailable
    }
  }, [isLoggedInProp]);

  const engineStatus = useSyncExternalStore(
    subscribeSyncStatus,
    getSyncStatusSnapshot,
    getServerSyncStatusSnapshot,
  );

  const pendingCount = Math.max(dexiePendingCount, engineStatus.pendingCount);

  // Feedback #37: phân biệt trạng thái khi đã đăng nhập vs chưa đăng nhập
  const resolution = resolveSyncBadgeState({
    pendingCount,
    isLoggedIn,
    engineState: state ?? engineStatus.state,
  });

  const resolvedState = resolution.state;
  const label = resolution.label;
  const variant = VARIANTS[resolvedState] ?? VARIANTS.offline;

  const handleClick = async () => {
    if (!isLoggedIn || resolvedState === 'offline' || resolvedState === 'unconfigured') {
      router.push('/cai-dat#heading-account');
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
      <span className={cn('truncate', !showTextOnMobile && 'hidden sm:inline')}>
        {label}
      </span>
    </button>
  );
}
