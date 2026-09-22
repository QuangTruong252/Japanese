import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/cai-dat';

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${requestUrl.origin}${next}`);
      }
    } catch {
      // Supabase unconfigured or exchange error
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/cai-dat?error=auth_failed`);
}
