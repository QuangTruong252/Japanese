import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllReferenceDocs, getReferenceDocBySlug } from '@/lib/lookup';
import { ReferenceBook } from '@/components/lookup/ReferenceBook';

export function generateStaticParams() {
  return getAllReferenceDocs().map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getReferenceDocBySlug(slug);
  if (!doc) {
    return { title: 'Không tìm thấy bảng tham chiếu · MaiPace' };
  }
  return {
    title: `${doc.title.vi} · Bảng tham chiếu N5 · MaiPace`,
    description: doc.description.vi,
  };
}

export default async function ReferenceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getReferenceDocBySlug(slug);

  if (!doc) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 sm:px-6 md:pb-12 lg:max-w-[1200px] lg:px-8">
      <ReferenceBook
        docs={getAllReferenceDocs()}
        doc={doc}
        mobileBack={{ href: '/hoc/tra-cuu/bang', label: 'Bảng tham chiếu' }}
      />
    </main>
  );
}
