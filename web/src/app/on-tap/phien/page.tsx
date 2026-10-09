'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SessionNotice, SessionSkeleton } from '@/components/practice/SessionFrame';
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
  // Lỗi tải dữ liệu bài không được chốt thành phiên rỗng (sẽ hiện "không còn mục nào" dù mục vẫn đến hạn).
  if (ready && !queue.error && session === null) {
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

  if (queue.error) {
    return (
      <SessionNotice message="Không tải được câu hỏi.">
        <Button size="quiz" className="w-full font-semibold" onClick={queue.retry}>
          Thử lại
        </Button>
        <Button size="quiz" variant="outline" className="w-full" onClick={() => router.push('/on-tap')}>
          Về trang ôn tập
        </Button>
      </SessionNotice>
    );
  }

  if (!ready || session === null) {
    return <SessionSkeleton />;
  }

  // Không dựng được câu nào: nói rõ lý do và KHÔNG ghi gì — dueAt của các mục giữ nguyên.
  if (session.questions.length === 0) {
    const hasAudioBlock = !hasVoice && queue.sessionTargetIds.size > 0;
    const message =
      queue.sessionTargetIds.size === 0
        ? 'Không còn mục nào đến hạn ôn tập lúc này.'
        : hasAudioBlock
          ? 'Các mục đến hạn chỉ có câu dạng nghe, nhưng máy chưa có giọng tiếng Nhật (ja-JP). Hạn ôn của chúng giữ nguyên.'
          : 'Các mục đến hạn không tạo được câu hỏi nào trên máy này. Hạn ôn của chúng giữ nguyên.';
    return (
      <SessionNotice message={message}>
        {hasAudioBlock && (
          <Button size="quiz" variant="outline" className="w-full" onClick={() => router.push('/cai-dat/audio')}>
            Cài đặt âm thanh
          </Button>
        )}
        <Button size="quiz" className="w-full font-semibold" onClick={() => router.push('/on-tap')}>
          Về trang ôn tập
          <ArrowRight aria-hidden="true" />
        </Button>
        <Button size="quiz" variant="ghost" className="w-full" onClick={() => router.push('/')}>
          Về Bảng tin
        </Button>
      </SessionNotice>
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
      allPoolQuestions={queue.questions}
      availableAudioKeys={audioKeys}
      dailyNewLimit={queue.dailyNewLimit}
    />
  );
}

export default function ReviewSessionPage() {
  return (
    <Suspense
      fallback={<SessionSkeleton />}
    >
      <ReviewSessionContent />
    </Suspense>
  );
}
