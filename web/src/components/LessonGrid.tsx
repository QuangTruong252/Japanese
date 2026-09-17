'use client';

import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressBar } from '@/components/LessonProgress';
import { db } from '@/lib/db';
import { countLearnedByLesson } from '@/lib/stats';
import type { LessonSummary } from '@/lib/lessons';

export function LessonGrid({ summaries }: { summaries: LessonSummary[] }) {
  // MỘT query cho cả lưới, không phải 25 subscription. targetId là primary key nên
  // startsWith chạy trên index; primaryKeys() không kéo fsrsCard về.
  const targetIds = useLiveQuery(
    () => db.reviewItems.where('targetId').startsWith('vocab-').primaryKeys(),
    [],
    [] as string[]
  );
  const learnedByLesson = countLearnedByLesson(targetIds);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {summaries.map((s) => {
        const hasTranslation = Boolean(s.title?.vi);
        if (!hasTranslation) {
          return (
            <div key={s.number} className="rounded-xl opacity-50 cursor-not-allowed">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Bài {s.number}</CardTitle>
                  <CardDescription>Chưa có bản dịch</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {s.vocabCount} từ · {s.grammarCount} mẫu ngữ pháp
                  </p>
                  <ProgressBar learned={0} total={s.vocabCount} />
                </CardContent>
              </Card>
            </div>
          );
        }

        return (
          <Link
            key={s.number}
            href={`/hoc/${s.number}`}
            className="rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardTitle>
                  Bài {s.number} — {s.title.vi}
                </CardTitle>
                {s.jpTitle && (
                  <p className="jp text-sm font-medium text-muted-foreground">{s.jpTitle}</p>
                )}
                <CardDescription>{s.description?.vi}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {s.vocabCount} từ · {s.grammarCount} mẫu ngữ pháp
                </p>
                <ProgressBar
                  learned={learnedByLesson.get(s.number) ?? 0}
                  total={s.vocabCount}
                />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
