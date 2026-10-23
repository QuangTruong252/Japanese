import type { ReactNode } from 'react';
import Link from 'next/link';
import { Info } from 'lucide-react';
import type { ReferenceDocument, TableCell } from '@/types/lookup';
import { Furigana } from '@/components/Furigana';
import { BackLink, BookSpread, Ribbon, SectionHeader } from '@/components/PaperKit';
import { cn } from '@/lib/utils';

const JAPANESE_CHAR_REGEX = /[一-鿿㐀-䶿ぁ-んァ-ヶ]/;

function RenderCellContent({ cell }: { cell: TableCell }) {
  if (typeof cell === 'string') {
    if (!cell) return null;
    if (cell.includes('[') && cell.includes(']')) {
      return <Furigana text={cell} className="text-foreground" />;
    }
    const isJp = JAPANESE_CHAR_REGEX.test(cell);
    return <span className={cn(isJp && 'font-jp font-medium whitespace-nowrap md:text-lg')}>{cell}</span>;
  }

  if (typeof cell === 'object' && cell !== null) {
    const text = cell.vi || cell.en || '';
    if (!text) return null;
    if (text.includes('[') && text.includes(']')) {
      return <Furigana text={text} className="text-foreground" />;
    }
    const isJp = JAPANESE_CHAR_REGEX.test(text);
    return <span className={cn(isJp && 'font-jp font-medium whitespace-nowrap md:text-lg')}>{text}</span>;
  }

  return null;
}

function ReferenceSections({ doc }: { doc: ReferenceDocument }) {
  return (
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
                            'px-3.5 py-3 align-middle text-sm text-foreground md:py-3.5',
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
  );
}

/** Viên thuốc link tới một bảng; bảng đang xem dùng nền sakura chữ đỏ. */
export function DocChip({ href, current, children }: { href: string; current?: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring',
        current ? 'border-primary/40 bg-accent text-primary' : 'border-border bg-card text-foreground hover:bg-muted/60',
      )}
    >
      {children}
    </Link>
  );
}

/**
 * Sách mở của bảng tham chiếu từ `md`: tablet là hàng chip rồi bảng, PC là mục lục 10 bảng ở trang trái và bảng
 * chiếm trang phải. Dưới `md` chỉ còn nội dung bảng (tiêu đề + các bảng) với `mobileBack` làm nút quay lại.
 */
export function ReferenceBook({
  docs,
  doc,
  mobileBack,
}: {
  docs: ReferenceDocument[];
  doc: ReferenceDocument;
  mobileBack?: { href: string; label: string };
}) {
  const hubBack = <BackLink href="/hoc/tra-cuu" label="Tra cứu" />;

  const left = (
    <div className="hidden md:block md:max-lg:mb-6">
      <p className="font-serif text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">Bảng tham chiếu</p>
      <p className="mt-1 text-sm text-muted-foreground">{docs.length} bảng</p>

      <nav aria-label="Các bảng tham chiếu" className="mt-4 flex flex-wrap gap-2 lg:hidden">
        {docs.map((d) => (
          <DocChip key={d.slug} href={`/hoc/tra-cuu/bang/${d.slug}`} current={d.slug === doc.slug}>
            {d.title.vi}
          </DocChip>
        ))}
      </nav>

      <nav aria-label="Mục lục bảng tham chiếu" className="mt-5 hidden lg:block">
        <ol className="divide-y divide-border border-y border-border">
          {docs.map((d, i) => {
            const current = d.slug === doc.slug;
            return (
              <li key={d.slug} className="relative">
                {current && <Ribbon className="top-3" />}
                <Link
                  href={`/hoc/tra-cuu/bang/${d.slug}`}
                  aria-current={current ? 'page' : undefined}
                  className={cn(
                    'flex min-h-12 items-baseline gap-3 px-3 py-2.5 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring',
                    current ? 'bg-accent text-primary' : 'text-foreground hover:bg-muted/40',
                  )}
                >
                  <span className="w-7 shrink-0 text-right font-serif text-2xl font-semibold tabular-nums">{i + 1}</span>
                  <span className={cn('font-medium', current && 'font-serif font-semibold')}>{d.title.vi}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );

  const right = (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          {doc.title.vi}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{doc.description.vi}</p>
      </header>
      <ReferenceSections doc={doc} />
    </div>
  );

  return (
    <>
      {mobileBack ? (
        <>
          <div className="contents md:hidden">
            <BackLink {...mobileBack} />
          </div>
          <div className="hidden md:contents">{hubBack}</div>
        </>
      ) : (
        hubBack
      )}
      <BookSpread leftWidth="narrow" stickyTop="4.25rem" className="max-lg:space-y-0" left={left} right={right} />
    </>
  );
}
