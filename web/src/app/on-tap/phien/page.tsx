'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PracticeRunner } from '@/components/practice/PracticeRunner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { buildSession } from '@/lib/practice';
import { useDueQueue } from '@/lib/use-due-queue';
import { useJapaneseVoice } from '@/lib/use-question-pool';
import type { PracticeConfig, QuestionItem } from '@/types';

export default function ReviewSessionPage() {
  const router = useRouter();
  const queue = useDueQueue();
  const hasVoice = useJapaneseVoice();

  const audioKeys = useMemo(() => new Set(hasVoice ? ['tts'] : []), [hasVoice]);

  // Dựng MỘT lần rồi khóa lại. hasVoice === null nghĩa là còn đang dò giọng ja-JP: dựng lúc
  // đó sẽ chốt audioKeys rỗng và loại sạch câu nghe trên máy thật ra CÓ giọng.
  const [session, setSession] = useState<{
    questions: QuestionItem[];
    config: PracticeConfig;
  } | null>(null);

  const ready = !queue.loading && hasVoice !== null;

  if (ready && session === null) {
    const { questions } = buildSession(
      queue.questions,
      queue.config,
      audioKeys,
      queue.sessionTargetIds,
    );
    setSession({ questions, config: queue.config });
  }

  if (!ready || session === null) {
    return (
      <main className="fixed inset-0 z-40 mx-auto flex w-full max-w-xl flex-col justify-between bg-background px-4 py-6">
        <div className="flex items-center justify-between">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-8 w-64" />
          <Skeleton className="mx-auto h-4 w-48" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </main>
    );
  }

  // Không dựng được câu nào: nói rõ lý do và KHÔNG ghi gì — dueAt của các mục giữ nguyên.
  if (session.questions.length === 0) {
    return (
      <main className="fixed inset-0 z-40 mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="text-muted-foreground">
          {queue.sessionTargetIds.size === 0
            ? 'Không còn mục nào đến hạn ôn tập.'
            : 'Các mục đến hạn không tạo được câu hỏi nào trên máy này. Hạn ôn của chúng giữ nguyên.'}
        </p>
        <Button size="quiz" onClick={() => router.push('/on-tap')}>
          Về trang ôn tập
        </Button>
      </main>
    );
  }

  return <PracticeRunner questions={session.questions} config={session.config} />;
}
