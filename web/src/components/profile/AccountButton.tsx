'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface AccountButtonProps {
  className?: string;
  variant?: 'header' | 'sidebar' | 'pill';
  showLabel?: boolean;
}

export function AccountButton({
  className,
  variant = 'header',
  showLabel = true,
}: AccountButtonProps) {
  const pathname = usePathname();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setIsLoggedIn(true);
          setAvatarUrl(user.user_metadata?.avatar_url ?? null);
          setDisplayName(
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            null
          );
        }
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setIsLoggedIn(true);
          setAvatarUrl(session.user.user_metadata?.avatar_url ?? null);
          setDisplayName(
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            session.user.email?.split('@')[0] ||
            null
          );
        } else {
          setIsLoggedIn(false);
          setAvatarUrl(null);
          setDisplayName(null);
        }
      });

      return () => subscription.unsubscribe();
    } catch {
      // Supabase unconfigured / unavailable
    }
  }, []);

  const isActive = pathname === '/ca-nhan' || pathname.startsWith('/ca-nhan/');

  return (
    <Link
      href="/ca-nhan"
      aria-current={isActive ? 'page' : undefined}
      aria-label={
        isLoggedIn && displayName
          ? `Tài khoản ${displayName} — Hồ sơ & Tiến độ`
          : 'Tài khoản & Tiến độ'
      }
      className={cn(
        'inline-flex items-center gap-2 rounded-xl transition duration-150 outline-none select-none cursor-pointer',
        'focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2',
        variant === 'header' && [
          'min-h-[48px] px-3.5 py-2 text-sm font-medium border border-border/80 bg-card/70 hover:bg-muted/70',
          isActive ? 'border-primary/50 text-primary bg-primary/10 shadow-xs' : 'text-foreground',
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
            className="size-6 sm:size-7 rounded-full object-cover border border-border/80"
          />
        ) : (
          <div className="size-6 sm:size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
            <User className="size-4" />
          </div>
        )}
      </div>

      {showLabel && (
        <span className="truncate max-w-[120px] sm:max-w-[160px]">
          {isLoggedIn && displayName ? displayName : 'Tài khoản'}
        </span>
      )}
    </Link>
  );
}
