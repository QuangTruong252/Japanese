import type { Metadata } from 'next';
import { Info } from 'lucide-react';
import { FeatureIcon } from '@/components/FeatureIcon';
import { BackLink, ListRow } from '@/components/PaperKit';
import { LookupHeader } from '@/components/lookup/LookupHeader';
import { KanaChart } from './KanaChart';

export const metadata: Metadata = {
  title: 'Bảng chữ cái Kana · MaiPace',
  description: 'Bảng chữ cái tiếng Nhật Hiragana và Katakana 46 âm cơ bản, âm đục và âm ghép kèm phát âm giọng đọc.',
};

export default function KanaPage() {
  const header = (
    <>
      <LookupHeader title="Bảng chữ Kana" />

      <section aria-label="Chỉ dẫn cho người mới học chữ Kana">
      <details className="group rounded-xl border border-border bg-card text-sm">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-4 font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <Info className="size-4 shrink-0 text-primary" aria-hidden="true" />
          Chỉ dẫn
        </summary>
        <ul className="list-inside list-disc space-y-1.5 px-4 pb-4 text-muted-foreground">
          <li>
            Bạn nên học thuộc bảng <strong className="text-foreground">Hiragana</strong> trước vì đây là nền tảng tối cần thiết để bắt đầu bài 1.
          </li>
          <li>
            Furigana (chữ nhỏ phiên âm trên đầu Kanji) trong ứng dụng luôn dùng <strong className="text-foreground">Hiragana</strong> để hiển thị cách đọc.
          </li>
          <li>
            Bảng <strong className="text-foreground">Katakana</strong> chủ yếu dùng để ghi các từ mượn tiếng nước ngoài, tên riêng quốc tế và từ tượng thanh.
          </li>
        </ul>
      </details>
      </section>

      <ListRow href="/luyen-viet" icon={<FeatureIcon name="kana" />} title="Luyện viết kana" className="lg:hidden" />
    </>
  );

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-24 sm:px-6 md:pb-12 lg:max-w-[1200px] lg:px-8">
      <BackLink href="/hoc/tra-cuu" label="Tra cứu" />
      <KanaChart header={header} />
    </main>
  );
}
