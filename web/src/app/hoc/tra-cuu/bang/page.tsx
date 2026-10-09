import type { Metadata } from 'next';
import { getAllReferenceDocs } from '@/lib/lookup';
import { FeatureIcon } from '@/components/FeatureIcon';
import { ListRow, PageTitle } from '@/components/PaperKit';

export const metadata: Metadata = {
  title: '10 Bảng tham chiếu N5 · Tra cứu · MaiPace',
  description: '10 bảng tra cứu nhanh chuyên đề: Tính từ, Lịch, Lượng từ đếm, Đại từ chỉ thị, Gia đình, Chào hỏi, Số đếm, Trợ từ, Từ để hỏi, Giờ giấc.',
};

export default function ReferenceTablesIndexPage() {
  const docs = getAllReferenceDocs();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-24 sm:px-6 lg:px-8 lg:pb-12">
      <PageTitle title="Bảng tham chiếu" meta="10 bảng" back={{ href: '/hoc/tra-cuu', label: 'Tra cứu' }} />

      <div className="grid gap-2 md:grid-cols-2">
        {docs.map((doc) => (
          <ListRow
            key={doc.slug}
            href={`/hoc/tra-cuu/bang/${doc.slug}`}
            icon={<FeatureIcon name="lookup" />}
            title={doc.title.vi}
            detail={doc.description.vi}
          />
        ))}
      </div>
    </main>
  );
}
