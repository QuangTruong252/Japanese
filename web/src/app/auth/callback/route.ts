import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/cai-dat';

  // Hỗ trợ reverse proxy / load balancer (như Vercel)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  const isLocalEnv = process.env.NODE_ENV === 'development';

  const origin = isLocalEnv
    ? requestUrl.origin
    : forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : requestUrl.origin;

  const targetPath = next.startsWith('/') ? next : '/cai-dat';

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${targetPath}`);
      }
    } catch {
      // Supabase unconfigured or exchange error
    }
  }

  return NextResponse.redirect(`${origin}/cai-dat?error=auth_failed`);
}

