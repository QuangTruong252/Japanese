import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Furigana } from '@/components/Furigana';
import { LessonProgress } from '@/components/LessonProgress';
import { SpeakButton } from '@/components/SpeakButton';
import { AVAILABLE_N5_LESSONS, loadLessonData, parseLessonNumber } from '@/lib/lessons';
import { stripFurigana } from '@/lib/japanese';
import { Card } from '@/components/ui/card';
import { ShadowingPlayer } from '@/components/audio/ShadowingPlayer';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

export function generateStaticParams() {
  return AVAILABLE_N5_LESSONS.map((n) => ({ so: String(n) }));
}

const VERB_GROUP: Record<string, { label: string; className: string }> = {
  'verb-godan': { label: 'Nhóm 1', className: 'bg-verb-1 text-primary-foreground font-semibold' },
  'verb-ichidan': { label: 'Nhóm 2', className: 'bg-verb-2 text-primary-foreground font-semibold' },
  'verb-irregular': { label: 'Nhóm 3', className: 'bg-verb-3 text-primary-foreground font-semibold' },
};

function formatGrammarText(text: string): string {
  // Thay thế bracket không phải furigana (không đứng liền sau chữ Hán) thành ngoặc đơn dạng đọc được
  // Ví dụ: "どこ[へ]も" -> "どこ(へ)も", "địa điểm[へ]も" -> "địa điểm(へ)も"
  return text.replace(/(?<![一-鿿㐀-䶿々〆〇ヶ])\[([^\]]+)\]/g, '($1)');
}

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ so: string }>;
}) {
  const { so } = await params;
  const lessonNum = parseLessonNumber(so);
  if (lessonNum === null) notFound();

  const { lesson, vocab } = await loadLessonData(lessonNum);

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6 pt-6 sm:pt-10">
      {/* 1. Header bài học & Breadcrumb */}
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/hoc"
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'min-h-11 h-11 px-3 -ml-3 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors font-medium'
            )}
          >
            <ChevronLeft className="size-4 mr-1" />
            <span>Danh sách bài học N5</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle className="size-10 rounded-xl" />
            <SearchTrigger iconOnly className="size-10 rounded-xl lg:hidden" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Minna no Nihongo · Bài {lesson.number}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Bài {lesson.number} — {lesson.title.vi}
          </h1>
          {lesson.jpTitle && (
            <div className="font-jp text-base font-semibold text-primary">
              <Furigana text={formatGrammarText(lesson.jpTitle)} className="text-base font-semibold text-primary" />
            </div>
          )}
          {lesson.description?.vi && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {lesson.description.vi}
            </p>
          )}
        </div>

        {/* Thẻ tiến độ bài học Washi */}
        <Card className="rounded-2xl border-border/80 bg-card p-4 shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider">
                Tiến trình hoàn thành từ vựng
              </span>
              <span className="font-semibold text-foreground">{vocab.length} từ vựng</span>
            </div>
            <LessonProgress lesson={lessonNum} total={vocab.length} />
          </div>
        </Card>

        {/* Nút Luyện tập bài này gần đầu */}
        <div className="pt-1">
          <Link
            href={`/luyen-tap?lessons=${lessonNum}`}
            className={cn(
              buttonVariants({ size: 'quiz' }),
              'w-full sm:w-auto justify-center font-semibold rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20'
            )}
          >
            <span>Luyện tập bài {lesson.number}</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      {/* Thanh nhảy nhanh sticky dưới header: Từ vựng / Ngữ pháp / Nghe / Luyện tập */}
      <nav
        aria-label="Mục lục bài học"
        className="sticky top-0 z-20 -mx-4 px-4 sm:mx-0 sm:px-0 py-2.5 bg-background/95 backdrop-blur-md border-b border-border/60"
      >
        <div className="grid grid-cols-4 gap-1.5 sm:flex sm:items-center sm:gap-2">
          <a
            href="#tu-vung"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'min-h-11 h-11 w-full sm:w-auto px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold'
            )}
          >
            Từ vựng
          </a>
          <a
            href="#ngu-phap"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'min-h-11 h-11 w-full sm:w-auto px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold'
            )}
          >
            Ngữ pháp
          </a>
          <a
            href="#nghe"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'min-h-11 h-11 w-full sm:w-auto px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold'
            )}
          >
            Nghe
          </a>
          <a
            href="#luyen-tap"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'min-h-11 h-11 w-full sm:w-auto px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold'
            )}
          >
            Luyện tập
          </a>
        </div>
      </nav>

      {/* 2. Từ vựng trọng tâm */}
      <section id="tu-vung" className="scroll-mt-20 sm:scroll-mt-24 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">Từ vựng trọng tâm</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
              {vocab.length} từ
            </span>
          </div>
        </div>
        <Link
          href={`/hoc/${lessonNum}/tu-vung`}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'quiz' }),
            'w-full justify-center sm:w-auto',
          )}
        >
          Học và theo dõi từ vựng bài này
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>

        <Card className="rounded-2xl border-border/80 bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm block md:table">
              <thead className="hidden md:table-header-group">
                <tr className="border-b border-border/80 bg-muted/30 text-xs font-semibold text-muted-foreground">
                  <th scope="col" className="py-3 px-4">Từ vựng</th>
                  <th scope="col" className="py-3 px-4">Ý nghĩa tiếng Việt</th>
                  <th scope="col" className="py-3 px-4 text-right">Phát âm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 block md:table-row-group">
                {vocab.map((w) => {
                  const group = VERB_GROUP[w.type];
                  return (
                    <tr
                      key={w.id}
                      id={`vocab-${w.id}`}
                      className="block p-3.5 sm:p-4 md:table-row md:py-3 md:px-4 scroll-mt-24 hover:bg-muted/30 transition-colors"
                    >
                      <td className="block md:table-cell p-0 md:py-3 md:px-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Furigana text={formatGrammarText(w.word)} className="text-lg font-medium text-foreground" />
                              {group && (
                                <Badge className={cn('h-auto text-[10px] px-1.5 py-0.2 rounded', group.className)}>
                                  {group.label}
                                </Badge>
                              )}
                            </div>
                            {w.verbForms && (
                              <span className="text-xs text-muted-foreground">
                                Thể masu: <Furigana text={formatGrammarText(w.verbForms.masu)} />
                              </span>
                            )}
                          </div>
                          {/* Mobile: nút phát âm gộp trong ô từ */}
                          <div className="md:hidden shrink-0">
                            <SpeakButton text={w.kana} label={stripFurigana(formatGrammarText(w.word))} />
                          </div>
                        </div>
                      </td>
                      <td className="block md:table-cell p-0 pt-1.5 md:py-3 md:px-4 text-sm text-foreground/90">
                        {w.meaning.vi ? (
                          <span className="translation leading-relaxed">{w.meaning.vi}</span>
                        ) : (
                          <span className="opacity-50 italic">Chưa có bản dịch</span>
                        )}
                      </td>
                      <td className="hidden md:table-cell py-3 px-4 text-right">
                        <SpeakButton text={w.kana} label={stripFurigana(formatGrammarText(w.word))} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* 3. Ngữ pháp & Mẫu câu */}
      <section id="ngu-phap" className="scroll-mt-20 sm:scroll-mt-24 space-y-5">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-foreground">Ngữ pháp & Mẫu câu</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
            {lesson.grammar.length} mẫu
          </span>
        </div>

        <div className="space-y-6">
          {lesson.grammar.map((point) => (
            <Card
              key={point.id}
              id={`grammar-${point.id}`}
              className="scroll-mt-24 rounded-2xl border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4"
            >
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  <Furigana text={formatGrammarText(point.title.vi)} />
                </h3>
              </div>

              {/* Khối cấu trúc mẫu câu Washi */}
              <div className="grammar-pattern-block rounded-xl bg-muted/60 p-4 border border-border/60">
                <div className="font-jp text-lg sm:text-xl font-semibold text-primary">
                  <Furigana text={formatGrammarText(point.pattern.vi)} className="text-lg sm:text-xl font-semibold text-primary" />
                </div>
              </div>

              <p className="text-sm text-foreground/90 leading-relaxed">
                {point.explanation.vi}
              </p>

              {/* Các câu ví dụ */}
              {point.examples.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-border/60">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Ví dụ minh họa
                  </div>
                  <ul className="space-y-3">
                    {point.examples.map((ex, i) => (
                      <li
                        key={i}
                        className="flex items-start justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors"
                      >
                        <div className="space-y-1">
                          <Furigana text={formatGrammarText(ex.jp)} className="text-base sm:text-lg font-medium text-foreground" />
                          <span className="translation block text-xs sm:text-sm text-muted-foreground">
                            {ex.translation.vi}
                          </span>
                        </div>
                        <SpeakButton
                          text={stripFurigana(formatGrammarText(ex.jp))}
                          label={stripFurigana(formatGrammarText(ex.jp))}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {point.sourceRef && (
                <p className="text-xs text-muted-foreground/80 pt-1">
                  Nguồn: {point.sourceRef}
                </p>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* 4. Khối Audio & Trình phát Shadowing (SPEC-10) */}
      <section id="nghe" className="scroll-mt-20 sm:scroll-mt-24 space-y-4 pt-6 border-t border-border/80">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">Audio & Shadowing</h2>
          <p className="text-sm text-muted-foreground">
            Luyện nghe và nói theo bài học với tính năng lặp đoạn A-B và điều chỉnh tốc độ.
          </p>
        </div>
        <ShadowingPlayer
          lessonNum={lessonNum}
          examples={lesson.grammar.flatMap((g) => g.examples)}
        />
      </section>

      {/* 5. Nguồn */}
      {lesson.sourceRef && (
        <p className="pt-4 border-t border-border/80 text-xs text-muted-foreground">
          Tài liệu tham khảo: Giáo trình Minna no Nihongo {lesson.sourceRef.book}, tr. {lesson.sourceRef.pages}
        </p>
      )}

      {/* 6. Nút CTA chuyển sang Luyện tập */}
      <section id="luyen-tap" className="scroll-mt-20 sm:scroll-mt-24 pt-2">
        <Link
          href={`/luyen-tap?lessons=${lessonNum}`}
          className={cn(
            buttonVariants({ size: 'lg' }),
            'w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-primary/20'
          )}
        >
          <span>Luyện tập bài {lesson.number} ngay</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </main>
  );
}
