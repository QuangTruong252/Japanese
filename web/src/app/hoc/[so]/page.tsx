import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Furigana } from '@/components/Furigana';
import { LessonProgress } from '@/components/LessonProgress';
import { SpeakButton } from '@/components/SpeakButton';
import { AVAILABLE_N5_LESSONS, loadLessonData, parseLessonNumber } from '@/lib/lessons';
import { stripFurigana } from '@/lib/japanese';
import { cn } from 'cn';

export function generateStaticParams() {
  return AVAILABLE_N5_LESSONS.map((n) => ({ so: String(n) }));
}

const VERB_GROUP: Record<string, { label: string; className: string }> = {
  'verb-1': { label: 'Nhóm 1', className: 'bg-verb-1 text-primary-foreground' },
  'verb-2': { label: 'Nhóm 2', className: 'bg-verb-2 text-primary-foreground' },
  'verb-3': { label: 'Nhóm 3', className: 'bg-verb-3 text-primary-foreground' },
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
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-6">
      {/* Header */}
      <header className="space-y-4">
        <Link
          href="/hoc"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            '-ml-2.5 text-muted-foreground hover:text-foreground'
          )}
        >
          <ChevronLeft className="size-4" />
          <span>Danh sách bài</span>
        </Link>
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">
            Bài {lesson.number} — {lesson.title.vi}
          </h1>
          {lesson.jpTitle && (
            <p className="jp text-base font-medium text-muted-foreground">
              {lesson.jpTitle}
            </p>
          )}
          {lesson.description?.vi && (
            <p className="text-sm text-muted-foreground pt-1">
              {lesson.description.vi}
            </p>
          )}
        </div>
        <LessonProgress lesson={lessonNum} total={vocab.length} />
      </header>

      {/* Từ vựng */}
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-medium">Từ vựng</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th scope="col" className="py-2 font-normal">Từ</th>
                <th scope="col" className="py-2 font-normal">Nghĩa</th>
                <th scope="col" className="py-2 font-normal text-right">
                  <span className="sr-only">Phát âm</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {vocab.map((w) => {
                const group = VERB_GROUP[w.type];
                return (
                  <tr
                    key={w.id}
                    id={`vocab-${w.id}`}
                    className="scroll-mt-24 border-t border-foreground/5 align-top"
                  >
                    <td className="py-2 pr-4">
                      <span className="flex flex-col items-start gap-1">
                        <Furigana text={w.word} className="text-lg" />
                        {group && (
                          <Badge className={cn('h-auto', group.className)}>
                            {group.label}
                          </Badge>
                        )}
                      </span>
                    </td>
                    <td className="py-2 text-sm">
                      {w.meaning.vi ? (
                        <span className="translation">{w.meaning.vi}</span>
                      ) : (
                        <span className="opacity-50">Chưa có bản dịch</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <SpeakButton text={w.kana} label={stripFurigana(w.word)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Ngữ pháp */}
      <section className="space-y-6">
        <h2 className="font-heading text-xl font-medium">Ngữ pháp</h2>
        <div className="space-y-6">
          {lesson.grammar.map((point) => (
            <section
              key={point.id}
              id={`grammar-${point.id}`}
              className="scroll-mt-24 space-y-3"
            >
              <h3 className="jp text-lg font-medium">{point.title.vi}</h3>
              <p className="jp rounded-lg bg-muted p-4 text-xl">{point.pattern.vi}</p>
              <p className="text-sm leading-relaxed">{point.explanation.vi}</p>
              <ul className="space-y-3">
                {point.examples.map((ex, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex-1">
                      <Furigana text={ex.jp} className="text-xl" />
                      <span className="translation block text-sm text-muted-foreground">
                        {ex.translation.vi}
                      </span>
                    </span>
                    <SpeakButton
                      text={stripFurigana(ex.jp)}
                      label={stripFurigana(ex.jp)}
                    />
                  </li>
                ))}
              </ul>
              {point.sourceRef && (
                <p className="text-xs text-muted-foreground">Nguồn: {point.sourceRef}</p>
              )}
            </section>
          ))}
        </div>
      </section>

      {/* Nguồn và Xác minh */}
      <div className="space-y-2 pt-4 border-t border-foreground/10">
        {lesson.sourceRef && (
          <p className="text-xs text-muted-foreground">
            Nguồn: {lesson.sourceRef.book}, tr. {lesson.sourceRef.pages}
          </p>
        )}
        {lesson.verification !== 'verified' && (
          <p className="text-sm text-muted-foreground">
            Nội dung bài này chưa đối chiếu bản in. Vẫn học được, nhưng hãy kiểm lại khi có sách.
          </p>
        )}
      </div>

      {/* CTA Luyện tập */}
      <div className="pt-2">
        <Link
          href={`/luyen-tap?lessons=${lessonNum}`}
          className={cn(buttonVariants({ size: 'quiz' }), 'w-full')}
        >
          Luyện tập bài này
        </Link>
      </div>
    </main>
  );
}
