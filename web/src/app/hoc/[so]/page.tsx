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
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              '-ml-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors'
            )}
          >
            <ChevronLeft className="size-4 mr-1" />
            <span>Danh sách bài học N5</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle className="size-9 rounded-xl" />
            <SearchTrigger iconOnly className="size-9 rounded-xl lg:hidden" />
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
            <p className="jp font-jp text-base font-semibold text-primary">
              {lesson.jpTitle}
            </p>
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
      </header>

      {/* 2. Từ vựng trọng tâm */}
      <section className="space-y-4">
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
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30 text-xs font-semibold text-muted-foreground">
                  <th scope="col" className="py-3 px-4">Từ vựng</th>
                  <th scope="col" className="py-3 px-4">Ý nghĩa tiếng Việt</th>
                  <th scope="col" className="py-3 px-4 text-right">Phát âm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {vocab.map((w) => {
                  const group = VERB_GROUP[w.type];
                  return (
                    <tr
                      key={w.id}
                      id={`vocab-${w.id}`}
                      className="scroll-mt-24 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-2">
                            <Furigana text={w.word} className="text-lg font-medium text-foreground" />
                            {group && (
                              <Badge className={cn('h-auto text-[10px] px-1.5 py-0.2 rounded', group.className)}>
                                {group.label}
                              </Badge>
                            )}
                          </div>
                          {w.verbForms && (
                            <span className="text-xs text-muted-foreground">
                              Thể masu: <Furigana text={w.verbForms.masu} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground/90">
                        {w.meaning.vi ? (
                          <span className="translation leading-relaxed">{w.meaning.vi}</span>
                        ) : (
                          <span className="opacity-50 italic">Chưa có bản dịch</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <SpeakButton text={w.kana} label={stripFurigana(w.word)} />
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
      <section className="space-y-5">
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
              className="scroll-mt-24 rounded-2xl border-border/80 bg-card p-6 shadow-sm space-y-4"
            >
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {point.title.vi}
                </h3>
              </div>

              {/* Khối cấu trúc mẫu câu Washi */}
              <div className="grammar-pattern-block rounded-xl bg-muted/60 p-4 border border-border/60">
                <p className="jp font-jp text-lg sm:text-xl font-semibold text-primary">
                  {point.pattern.vi}
                </p>
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
                          <Furigana text={ex.jp} className="text-base sm:text-lg font-medium text-foreground" />
                          <span className="translation block text-xs sm:text-sm text-muted-foreground">
                            {ex.translation.vi}
                          </span>
                        </div>
                        <SpeakButton
                          text={stripFurigana(ex.jp)}
                          label={stripFurigana(ex.jp)}
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
      <section className="space-y-4 pt-6 border-t border-border/80">
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

      {/* 5. Nút CTA chuyển sang Luyện tập */}
      <div className="pt-2">
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
      </div>
    </main>
  );
}
