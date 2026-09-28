'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export interface AccountButtonUser {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
}

interface AccountButtonProps {
  className?: string;
  variant?: 'header' | 'sidebar' | 'pill';
  showLabel?: boolean;
  user?: AccountButtonUser | null;
}

export function AccountButton({
  className,
  variant = 'header',
  showLabel = true,
  user: userProp,
}: AccountButtonProps) {
  const pathname = usePathname();
  const [internalUser, setInternalUser] = useState<AccountButtonUser | null>(null);

  useEffect(() => {
    // Nếu parent đã truyền user prop (như AppNav), không cần đăng ký thêm listener
    if (userProp !== undefined) return;
    if (!isSupabaseConfigured()) return;

    try {
      // Chỉ đọc session cục bộ: onAuthStateChange phát INITIAL_SESSION ngay khi đăng ký.
      const supabase = createClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setInternalUser({
            id: session.user.id,
            email: session.user.email,
            displayName:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email?.split('@')[0],
            avatarUrl: session.user.user_metadata?.avatar_url,
          });
        } else {
          setInternalUser(null);
        }
      });

      return () => subscription.unsubscribe();
    } catch {
      // Supabase unconfigured / unavailable
    }
  }, [userProp]);

  const activeUser = userProp !== undefined ? userProp : internalUser;
  const displayName = activeUser?.displayName;
  const avatarUrl = activeUser?.avatarUrl;
  const isLoggedIn = Boolean(activeUser);

  // Trên /ca-nhan/**, nút header Tài khoản hiển thị trạng thái active (aria-current="page") (SPEC-16 §3, §7)
  const isActive = pathname === '/ca-nhan' || pathname.startsWith('/ca-nhan/');

  return (
    <Link
      href="/ca-nhan"
      aria-current={isActive ? 'page' : undefined}
      aria-label={
        isLoggedIn && displayName
          ? `Tài khoản ${displayName}`
          : 'Tài khoản'
      }
      className={cn(
        'inline-flex items-center gap-2 transition duration-150 outline-none select-none cursor-pointer',
        'focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2',
        variant === 'header' && [
          'min-h-[48px] px-3.5 py-1.5 rounded-full text-xs font-medium border',
          isActive
            ? 'border-primary/50 text-primary bg-primary/10 font-semibold shadow-xs'
            : 'border-border/80 bg-card text-foreground hover:bg-muted/70',
        ],
        variant === 'pill' && [
          'min-h-[44px] sm:min-h-[48px] px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full border border-border/80 bg-background/95 dark:bg-card/95 shadow-sm hover:bg-muted/80',
          isActive ? 'border-primary/50 text-primary bg-primary/10' : 'text-foreground',
        ],
        variant === 'sidebar' && [
          'w-full px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted/60',
          isActive ? 'bg-primary/15 text-primary font-semibold' : 'text-foreground',
        ],
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

      {showLabel && (
        <span className="truncate max-w-[110px]">
          {isLoggedIn && displayName ? displayName : 'Tài khoản'}
        </span>
      )}
    </Link>
  );
}
