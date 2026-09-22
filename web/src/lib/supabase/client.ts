import { createBrowserClient } from '@supabase/ssr';

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    !url.includes('placeholder') &&
    !key.includes('placeholder')
  );
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('placeholder') || key.includes('placeholder')) {
    throw new Error(
      'Supabase chưa được cấu hình. Vui lòng cung cấp NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY trong file .env.local.'
    );
  }

  return createBrowserClient(url, key);
}
