import { redirect } from 'next/navigation';

interface ThongKeRedirectProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ThongKePage({ searchParams }: ThongKeRedirectProps) {
  const sp = await searchParams;
  const params = new URLSearchParams();

  if (sp) {
    for (const [key, value] of Object.entries(sp)) {
      if (typeof value === 'string') {
        params.set(key, value);
      } else if (Array.isArray(value)) {
        for (const v of value) {
          params.append(key, v);
        }
      }
    }
  }

  const query = params.toString();
  redirect(query ? `/ca-nhan/thong-ke?${query}` : '/ca-nhan/thong-ke');
}
