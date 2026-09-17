'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { CloudCheck, CloudOff, CloudUpload } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SyncState = 'synced' | 'pending' | 'offline';

interface SyncBadgeProps {
  className?: string;
  showTextOnMobile?: boolean;
  /**
   * F08 truyền trạng thái thật vào đây. Bỏ trống = tự suy từ hàng đợi cục bộ, và chưa bao giờ
   * ra 'synced': chưa có Supabase thì không có gì được đồng bộ, và hiện sai còn tệ hơn không
   * hiện (SPEC-02 §5).
   */
  state?: SyncState;
}

const VARIANTS: Record<SyncState, { label: (n: number) => string; className: string }> = {
  synced: {
    label: () => 'Đã đồng bộ',
    className: 'bg-success/10 text-success border-success/20',
  },
  pending: {
    label: (n) => `Chờ đồng bộ (${n})`,
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  offline: {
    label: () => 'Ngoại tuyến — đã lưu trên máy',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

const ICONS: Record<SyncState, typeof CloudOff> = {
  synced: CloudCheck,
  pending: CloudUpload,
  offline: CloudOff,
};

export function SyncBadge({ className, showTextOnMobile = false, state }: SyncBadgeProps) {
  const pendingCount = useLiveQuery(() => db.pendingSync.count(), []) ?? 0;

  const resolved: SyncState = state ?? (pendingCount > 0 ? 'pending' : 'offline');
  const variant = VARIANTS[resolved];
  const Icon = ICONS[resolved];
  const label = variant.label(pendingCount);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors select-none',
        variant.className,
        className
      )}
      role="status"
      aria-label={label}
      title={label}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span className={cn('whitespace-nowrap', !showTextOnMobile && 'hidden sm:inline')}>
        {label}
      </span>
    </div>
  );
}
