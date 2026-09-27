'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewRunner } from '@/components/review/ReviewRunner';
import { buildSession } from '@/lib/practice';
import { useDueQueue } from '@/lib/use-due-queue';
import { useJapaneseVoice } from '@/lib/use-question-pool';
import { useReviewDraft } from '@/lib/use-review-draft';
import type { AnswerResult, PracticeConfig, QuestionItem } from '@/types';

function ReviewSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queue = useDueQueue();
  const hasVoice = useJapaneseVoice();
  const { draft } = useReviewDraft();

  const [batchKey, setBatchKey] = useState(0);

  const audioKeys = useMemo(() => new Set(hasVoice ? ['tts'] : []), [hasVoice]);

  const [session, setSession] = useState<{
    questions: QuestionItem[];
    config: PracticeConfig;
    initialIndex: number;
    initialResults: AnswerResult[];
    initialDuration: number;
  } | null>(null);

  const ready = !queue.loading && hasVoice !== null;

  // Khởi tạo phiên từ bản nháp (nếu có yêu cầu resume hoặc nháp đang dở) hoặc tạo lô mới
  if (ready && session === null) {
    const shouldResume =
      draft !== null && (searchParams.get('resume') === '1' || draft.results.length > 0);

    if (shouldResume && draft) {
      setSession({
        questions: draft.questions,
        config: draft.config ?? queue.config,
        initialIndex: draft.currentIndex,
        initialResults: draft.results,
        initialDuration: draft.elapsedSec,
      });
    } else if (queue.sessionTargetIds.size > 0) {
      const { questions } = buildSession(
        queue.questions,
        queue.config,
        audioKeys,
        queue.sessionTargetIds,
      );
      setSession({
        questions,
        config: queue.config,
        initialIndex: 0,
        initialResults: [],
        initialDuration: 0,
      });
    } else {
      setSession({
        questions: [],
        config: queue.config,
        initialIndex: 0,
        initialResults: [],
        initialDuration: 0,
      });
    }
  }

  const handleStartNextBatch = useCallback(() => {
    setSession(null);
    setBatchKey((k) => k + 1);
  }, []);

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
    const hasAudioBlock = !hasVoice && queue.sessionTargetIds.size > 0;
    return (
      <main className="fixed inset-0 z-40 mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="text-muted-foreground text-sm sm:text-base">
          {queue.sessionTargetIds.size === 0
            ? 'Không còn mục nào đến hạn ôn tập lúc này.'
            : hasAudioBlock
            ? 'Các mục đến hạn chỉ có câu dạng nghe, nhưng máy chưa có giọng tiếng Nhật (ja-JP). Hạn ôn của chúng giữ nguyên.'
            : 'Các mục đến hạn không tạo được câu hỏi nào trên máy này. Hạn ôn của chúng giữ nguyên.'}
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          {hasAudioBlock && (
            <Button
              size="quiz"
              variant="outline"
              className="w-full"
              onClick={() => router.push('/cai-dat/audio')}
            >
              Cài đặt âm thanh
            </Button>
          )}
          <Button
            size="quiz"
            className="w-full"
            onClick={() => router.push('/on-tap')}
          >
            Về trang ôn tập
          </Button>
          <Button
            size="quiz"
            variant="ghost"
            className="w-full"
            onClick={() => router.push('/')}
          >
            Về Bảng tin
          </Button>
        </div>
      </main>
    );
  }

  return (
    <ReviewRunner
      key={batchKey}
      questions={session.questions}
      config={session.config}
      initialIndex={session.initialIndex}
      initialResults={session.initialResults}
      initialDuration={session.initialDuration}
      reviewBatchSize={queue.reviewBatchSize}
      onStartNextBatch={handleStartNextBatch}
    />
  );
}

export default function ReviewSessionPage() {
  return (
    <Suspense
      fallback={
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
          </div>
        </main>
      }
    >
      <ReviewSessionContent />
    </Suspense>
  );
}
