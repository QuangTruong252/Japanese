'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AccountButtonUser {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
}

interface AccountButtonProps {
  className?: string;
  // AppNav giữ listener đăng nhập duy nhất và truyền user xuống.
  user: AccountButtonUser | null;
}

export function AccountButton({ className, user }: AccountButtonProps) {
  const pathname = usePathname();
  const displayName = user?.displayName;
  const avatarUrl = user?.avatarUrl;

  // Trên /ca-nhan/**, nút header Tài khoản hiển thị trạng thái active (aria-current="page") (SPEC-16 §3, §7)
  const isActive = pathname === '/ca-nhan' || pathname.startsWith('/ca-nhan/');

  return (
    <Link
      href="/ca-nhan"
      aria-current={isActive ? 'page' : undefined}
      aria-label={user && displayName ? `Tài khoản ${displayName}` : 'Tài khoản'}
      className={cn(
        'inline-flex items-center gap-2 transition duration-150 outline-none select-none cursor-pointer',
        'focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2',
        'min-h-[48px] px-3.5 py-1.5 rounded-full text-xs font-medium border',
        isActive
          ? 'border-primary/50 text-primary bg-primary/10 font-semibold shadow-xs'
          : 'border-border/80 bg-card text-foreground hover:bg-muted/70',
        className
      )}
    >
      <div className="relative shrink-0 flex items-center justify-center">
        {avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={avatarUrl}
            alt=""
            className="size-6 rounded-full object-cover border border-border/80"
          />
        ) : (
          <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
            <User className="size-3.5" />
          </div>
        )}
      </div>
    </Link>
  );
}
