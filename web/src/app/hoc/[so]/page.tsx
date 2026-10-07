import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ChevronLeft,
  ArrowRight,
  FileArchive,
  Info,
  BookOpen,
  Headphones,
  ScrollText,
  PencilLine,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Furigana } from '@/components/Furigana';
import { SpeakButton } from '@/components/SpeakButton';
import { AVAILABLE_N5_LESSONS, loadLessonData, parseLessonNumber } from '@/lib/lessons';
import { formatOptionalBrackets, stripFurigana } from '@/lib/japanese';
import { ShadowingPlayer } from '@/components/audio/ShadowingPlayer';
import { Stage, LinkRow } from '@/components/PaperStage';
import { Illustration } from '@/components/Illustration';
import { LessonHeroSlip } from './_parts';
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
    <main className="mx-auto w-full max-w-2xl px-4 sm:px-6 pb-20 pt-2 sm:pt-4">
      {/* Nút quay lại ở normal flow phía trên cảnh */}
      <div className="mb-2">
        <Link
          href="/hoc"
          className="inline-flex min-h-12 items-center gap-1.5 -ml-2 px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring rounded-md"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span>Học bài</span>
        </Link>
      </div>

      {/* 1. Sân khấu & Tiêu đề: dùng chung cho có/không cover */}
      <header className="space-y-4">
        {lesson.cover && (
          <Stage
            asset={lesson.cover}
            sizes="(min-width: 672px) 672px, 100vw"
            eager
            imageClassName="h-44 sm:h-56 w-full object-cover"
            className="-mx-4 sm:mx-0"
          />
        )}

        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Bài {lesson.number}
          </p>
          {lesson.jpTitle && (
            <div className="jp">
              <Furigana
                text={formatOptionalBrackets(lesson.jpTitle)}
                className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground"
              />
            </div>
          )}
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            {lesson.title.vi}
          </h1>
        </div>

        {/* 2. Mảnh giấy đè lên mép cảnh: tiến độ + nút son duy nhất */}
        <LessonHeroSlip lessonNum={lessonNum} totalVocab={vocab.length} />
      </header>

      {/* 3. Ba dòng lối tắt */}
      <section aria-label="Lối tắt nội dung bài học" className="mt-4 divide-y divide-border">
        <LinkRow
          href="#ngu-phap"
          icon={<BookOpen className="size-5" aria-hidden="true" />}
          title={`Ngữ pháp · ${lesson.grammar.length} mẫu`}
        />
        <LinkRow
          href="#nghe"
          icon={<Headphones className="size-5" aria-hidden="true" />}
          title="Luyện nghe"
        />
        <LinkRow
          href="#tu-vung"
          icon={<ScrollText className="size-5" aria-hidden="true" />}
          title={`Xem toàn bộ bài · ${vocab.length} từ`}
        />
      </section>

      {/* 4. Nội dung tham khảo đầy đủ */}
      <div className="mt-8 space-y-10">
        {lesson.description?.vi && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {lesson.description.vi}
          </p>
        )}
        {/* Từ vựng */}
        <section id="tu-vung" className="scroll-mt-20 sm:scroll-mt-24 space-y-3 pt-6 border-t border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Từ vựng
            </h2>
            <span className="text-xs text-muted-foreground">
              {vocab.length} từ
            </span>
          </div>

          <div className="divide-y divide-border">
            {vocab.map((w) => {
              const group = VERB_GROUP[w.type];
              return (
                <div
                  key={w.id}
                  id={`vocab-${w.id}`}
                  className="flex items-center justify-between gap-3 py-3 sm:py-3.5 scroll-mt-20 sm:scroll-mt-24"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {w.illustration && (
                      <Illustration
                        asset={w.illustration}
                        sizes="48px"
                        className="size-12 shrink-0 object-contain rounded-md"
                      />
                    )}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="jp text-[18px] font-medium leading-loose text-foreground">
                          <Furigana text={formatOptionalBrackets(w.word)} />
                        </span>
                        {group && (
                          <Badge className={cn('h-auto text-xs px-1.5 py-0.5 rounded', group.className)}>
                            {group.label}
                          </Badge>
                        )}
                      </div>
                      {w.verbForms && (
                        <p className="text-xs text-muted-foreground">
                          Thể masu: <Furigana text={formatOptionalBrackets(w.verbForms.masu)} />
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {w.meaning.vi ? (
                          <span className="translation">{w.meaning.vi}</span>
                        ) : (
                          <span className="italic opacity-50">Chưa có bản dịch</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <SpeakButton
                      text={w.kana}
                      label={stripFurigana(formatOptionalBrackets(w.word))}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Ngữ pháp */}
        <section id="ngu-phap" className="scroll-mt-20 sm:scroll-mt-24 space-y-4 pt-6 border-t border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ngữ pháp
            </h2>
            <span className="text-xs text-muted-foreground">
              {lesson.grammar.length} mẫu
            </span>
          </div>

          <div className="space-y-6">
            {lesson.grammar.map((point) => (
              <div
                key={point.id}
                id={`grammar-${point.id}`}
                className="scroll-mt-20 sm:scroll-mt-24 space-y-3 pt-4 first:pt-0 border-t border-border/60 first:border-t-0"
              >
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  <Furigana text={formatOptionalBrackets(point.title.vi)} />
                </h3>

                {/* Khối cấu trúc mẫu câu Washi */}
                <div className="grammar-pattern-block rounded-lg bg-muted p-4">
                  <div className="jp jp-example font-medium text-foreground leading-loose">
                    <Furigana text={formatOptionalBrackets(point.pattern.vi)} />
                  </div>
                </div>

                <p className="text-sm text-foreground/90 leading-relaxed">
                  {point.explanation.vi}
                </p>

                {point.illustration && (
                  <figure className="flex flex-col gap-2">
                    <Illustration
                      asset={point.illustration}
                      sizes="(max-width: 672px) calc(100vw - 32px), 672px"
                      className="mx-auto h-auto w-full max-w-xl rounded-xl"
                    />
                    {point.illustrationCaption && (
                      <figcaption className="text-xs text-muted-foreground">
                        <Furigana text={point.illustrationCaption.vi} />
                      </figcaption>
                    )}
                  </figure>
                )}

                {/* Các câu ví dụ */}
                {point.examples.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Ví dụ
                    </p>
                    <div className="divide-y divide-border/60 rounded-xl bg-card border border-border/60 px-3.5">
                      {point.examples.map((ex, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between gap-3 py-3 first:pt-3.5 last:pb-3.5"
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="jp jp-example font-medium leading-loose text-foreground">
                              <Furigana text={formatOptionalBrackets(ex.jp)} />
                            </div>
                            <p className="translation text-sm text-muted-foreground leading-relaxed">
                              {ex.translation.vi}
                            </p>
                          </div>
                          <div className="shrink-0 pt-1">
                            <SpeakButton
                              text={stripFurigana(formatOptionalBrackets(ex.jp))}
                              label={stripFurigana(formatOptionalBrackets(ex.jp))}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {point.sourceRef && (
                  <p className="text-xs text-muted-foreground/80 pt-1">
                    Nguồn: {point.sourceRef}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Nghe */}
        <section id="nghe" className="scroll-mt-20 sm:scroll-mt-24 space-y-4 pt-6 border-t border-border">
          <div className="space-y-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Luyện nghe & Shadowing
            </h2>
            <p className="text-sm text-muted-foreground">
              Luyện nghe và nói theo bài học với tính năng lặp đoạn A-B và điều chỉnh tốc độ.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 flex items-start gap-2.5 text-xs text-muted-foreground">
            <Info className="size-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1 flex-1">
              <p>
                Nội dung audio đọc từ tệp ZIP đĩa CD cá nhân lưu trên máy. Nếu chưa có audio bài này, bạn vẫn có thể học trọn vẹn từ vựng và ngữ pháp ở trên.
              </p>
              <Link
                href={`/cai-dat/audio?returnTo=/hoc/${lessonNum}`}
                className="text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                <FileArchive className="size-3.5" aria-hidden="true" />
                <span>Thêm audio trong Cài đặt</span>
                <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <ShadowingPlayer
            lessonNum={lessonNum}
            examples={lesson.grammar.flatMap((g) => g.examples)}
          />
        </section>

        {/* Nguồn sách tham khảo */}
        {lesson.sourceRef && (
          <p className="pt-4 border-t border-border text-xs text-muted-foreground">
            Tài liệu tham khảo: Giáo trình Minna no Nihongo {lesson.sourceRef.book}, tr. {lesson.sourceRef.pages}
          </p>
        )}
        {lesson.verification === 'unverified' && (
          <p className="text-xs text-muted-foreground">
            Nội dung bài này chưa được đối chiếu với bản in
          </p>
        )}

        {/* 5. Lối phụ: Chuyển sang Luyện tập bài N ở chân trang */}
        <section id="luyen-tap" className="scroll-mt-20 sm:scroll-mt-24 pt-4 border-t border-border">
          <LinkRow
            href={`/luyen-tap?lessons=${lessonNum}`}
            icon={<PencilLine className="size-5" aria-hidden="true" />}
            title={`Luyện tập bài ${lesson.number}`}
            detail="Luyện tập trắc nghiệm & câu hỏi theo bài"
          />
        </section>
      </div>
    </main>
  );
}
