import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Info } from 'lucide-react';
import { getAllReferenceDocs, getReferenceDocBySlug } from '@/lib/lookup';
import type { TableCell } from '@/types/lookup';
import { Furigana } from '@/components/Furigana';
import { PageTitle, SectionHeader } from '@/components/PaperKit';
import { cn } from '@/lib/utils';

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

const JAPANESE_CHAR_REGEX = /[一-鿿㐀-䶿ぁ-んァ-ヶ]/;

function RenderCellContent({ cell }: { cell: TableCell }) {
  if (typeof cell === 'string') {
    if (!cell) return null;
    if (cell.includes('[') && cell.includes(']')) {
      return <Furigana text={cell} className="text-foreground" />;
    }
    const isJp = JAPANESE_CHAR_REGEX.test(cell);
    return <span className={cn(isJp && 'font-jp font-medium whitespace-nowrap')}>{cell}</span>;
  }

  if (typeof cell === 'object' && cell !== null) {
    const text = cell.vi || cell.en || '';
    if (!text) return null;
    if (text.includes('[') && text.includes(']')) {
      return <Furigana text={text} className="text-foreground" />;
    }
    const isJp = JAPANESE_CHAR_REGEX.test(text);
    return <span className={cn(isJp && 'font-jp font-medium whitespace-nowrap')}>{text}</span>;
  }

  return null;
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
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-24 sm:px-6 lg:px-8 lg:pb-12">
      <PageTitle
        title={doc.title.vi}
        meta={doc.description.vi}
        back={{ href: '/hoc/tra-cuu/bang', label: 'Bảng tham chiếu' }}
      />

      <div className="space-y-8">
        {doc.sections.map((section, sIdx) => (
          <section key={section.id || sIdx} className="space-y-3">
            {doc.sections.length > 1 && section.title.vi && (
              <SectionHeader id={`section-${section.id || sIdx}`} title={section.title.vi} />
            )}

            {/* Các bảng trong section */}
            {section.tables.map((table, tIdx) => (
              <div
                key={tIdx}
                tabIndex={0}
                role="region"
                aria-label={`${doc.title.vi} - ${section.title.vi || 'Bảng'}`}
                className="overflow-x-auto rounded-xl border border-border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring"
              >
                <table className="w-full border-collapse text-left text-sm">
                  <caption className="sr-only">
                    {doc.title.vi} - {section.title.vi}
                  </caption>
                  <thead>
                    <tr className="border-b border-border bg-secondary text-xs font-semibold text-muted-foreground">
                      {table.headers.map((h, hIdx) => {
                        // Bảo toàn 8 ô header rỗng có chủ đích
                        if (h.vi === '') {
                          return <th key={hIdx} scope="col" className={cn('px-3.5 py-3', hIdx === 0 ? 'min-w-30' : 'w-8')} aria-hidden="true" />;
                        }
                        return (
                          <th key={hIdx} scope="col" className={cn('whitespace-nowrap px-3.5 py-3', hIdx === 0 && 'min-w-30')}>
                            {h.vi}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {table.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="transition-colors hover:bg-muted/30">
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={cn(
                              'px-3.5 py-3 align-middle text-sm text-foreground',
                              cIdx === 0 && 'min-w-30',
                            )}
                          >
                            <RenderCellContent cell={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

            {/* Ghi chú của section (nếu có) */}
            {section.note?.vi && (
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{section.note.vi}</span>
              </p>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
