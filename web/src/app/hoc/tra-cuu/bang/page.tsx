import type { Metadata } from 'next';
import { getAllReferenceDocs } from '@/lib/lookup';
import { FeatureIcon } from '@/components/FeatureIcon';
import { ListRow, PageTitle } from '@/components/PaperKit';
import { ReferenceBook } from '@/components/lookup/ReferenceBook';

export const metadata: Metadata = {
  title: '10 Bảng tham chiếu N5 · Tra cứu · MaiPace',
  description: '10 bảng tra cứu nhanh chuyên đề: Tính từ, Lịch, Lượng từ đếm, Đại từ chỉ thị, Gia đình, Chào hỏi, Số đếm, Trợ từ, Từ để hỏi, Giờ giấc.',
};

export default function ReferenceTablesIndexPage() {
  const docs = getAllReferenceDocs();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 sm:px-6 md:pb-12 lg:max-w-[1200px] lg:px-8">
      {/* Mobile: danh sách bảng. Từ md: sách mở với bảng đầu tiên, bảng khác chọn bằng chip/mục lục */}
      <div className="space-y-6 md:hidden">
        <PageTitle title="Bảng tham chiếu" meta="10 bảng" back={{ href: '/hoc/tra-cuu', label: 'Tra cứu' }} />

        <div className="grid gap-2">
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
      </div>

      <div className="hidden md:block">
        <ReferenceBook docs={docs} doc={docs[0]} />
      </div>
    </main>
  );
}
