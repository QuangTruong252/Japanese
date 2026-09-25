import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Info } from 'lucide-react';
import { getAllReferenceDocs, getReferenceDocBySlug } from '@/lib/lookup';
import type { TableCell } from '@/types/lookup';
import { Furigana } from '@/components/Furigana';
import { buttonVariants } from '@/components/ui/button';
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
    return <span className={cn(isJp && 'font-jp font-medium')}>{cell}</span>;
  }

  if (typeof cell === 'object' && cell !== null) {
    const text = cell.vi || cell.en || '';
    if (!text) return null;
    if (text.includes('[') && text.includes(']')) {
      return <Furigana text={text} className="text-foreground" />;
    }
    const isJp = JAPANESE_CHAR_REGEX.test(text);
    return <span className={cn(isJp && 'font-jp font-medium')}>{text}</span>;
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
    <main className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 pt-6 sm:pt-10 pb-24">
      {/* 1. Header & Điều hướng quay lại */}
      <header className="space-y-4">
        <Link
          href="/hoc/tra-cuu/bang"
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'min-h-11 px-3 -ml-3 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors'
          )}
        >
          <ChevronLeft className="size-4 mr-1" />
          <span>Bảng tham chiếu</span>
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {doc.title.vi}
          </h1>
          <p className="text-sm text-muted-foreground">
            {doc.description.vi}
          </p>
        </div>
      </header>

      {/* 2. Render từng section */}
      <div className="space-y-8">
        {doc.sections.map((section, sIdx) => (
          <section key={section.id || sIdx} className="space-y-4">
            {/* Tiêu đề section (nếu tài liệu có từ 2 section trở lên hoặc tiêu đề khác với title chính) */}
            {doc.sections.length > 1 && section.title.vi && (
              <h2 className="text-lg font-bold text-foreground pt-2">
                {section.title.vi}
              </h2>
            )}

            {/* Các bảng trong section */}
            {section.tables.map((table, tIdx) => (
              <div
                key={tIdx}
                tabIndex={0}
                role="region"
                aria-label={`${doc.title.vi} - ${section.title.vi || 'Bảng'}`}
                className="overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-xs focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring"
              >
                <table className="w-full text-left text-sm border-collapse">
                  <caption className="sr-only">
                    {doc.title.vi} - {section.title.vi}
                  </caption>
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground">
                      {table.headers.map((h, hIdx) => {
                        // Bảo toàn 8 ô header rỗng có chủ đích (SPEC-12 §3.5)
                        if (h.vi === '') {
                          return (
                            <th
                              key={hIdx}
                              scope="col"
                              className="py-3 px-3.5 bg-muted/20 w-8"
                              aria-hidden="true"
                            />
                          );
                        }
                        return (
                          <th
                            key={hIdx}
                            scope="col"
                            className="py-3 px-3.5 whitespace-nowrap"
                          >
                            {h.vi}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {table.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="hover:bg-muted/20 transition-colors duration-100"
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="py-3 px-3.5 align-middle text-sm text-foreground"
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
              <div className="flex items-start gap-2.5 p-4 rounded-xl bg-muted/40 border border-border/60 text-xs sm:text-sm text-muted-foreground">
                <Info className="size-4 shrink-0 text-primary mt-0.5" />
                <span>{section.note.vi}</span>
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
