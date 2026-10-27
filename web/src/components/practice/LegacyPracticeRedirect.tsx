'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { legacyPracticeConfigHref } from '@/lib/nav';

export function LegacyPracticeRedirect({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params: Record<string, string | string[]> = {};
  for (const key of searchParams.keys()) params[key] = searchParams.getAll(key);
  const target = legacyPracticeConfigHref(params);

  // Hub giữ bản tĩnh để được tải sẵn khi online; chỉ link cấu hình cũ mới cần đổi địa chỉ phía client.
  useEffect(() => {
    if (target) router.replace(target);
  }, [router, target]);

  if (target) return <main className="mx-auto w-full max-w-5xl px-4 pt-6"><Skeleton className="h-56 w-full rounded-xl" /></main>;
  return children;
}
