'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { CloudOff, CloudUpload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncBadgeProps {
  className?: string;
  showTextOnMobile?: boolean;
}

export function SyncBadge({ className, showTextOnMobile = false }: SyncBadgeProps) {
  const pendingCount = useLiveQuery(() => db.pendingSync.count(), []) ?? 0;

  // Giai đoạn hiện tại (chưa có Supabase F08): hiển thị offline trung thực hoặc pending
  const isPending = pendingCount > 0;
  const label = isPending
    ? `Chờ đồng bộ (${pendingCount})`
    : 'Ngoại tuyến — đã lưu trên máy';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors select-none',
        isPending
          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
          : 'bg-muted text-muted-foreground border-border',
        className
      )}
      role="status"
      aria-label={label}
      title={label}
    >
      {isPending ? (
        <CloudUpload className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <CloudOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      )}
      <span className={cn('whitespace-nowrap', !showTextOnMobile && 'hidden sm:inline')}>
        {label}
      </span>
    </div>
  );
}
