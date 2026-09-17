'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PracticeRunner } from '@/components/practice/PracticeRunner';
import { buildSession } from '@/lib/practice';
import { useUIStore } from '@/lib/store';
import { useJapaneseVoice, useQuestionPool } from '@/lib/use-question-pool';
import type { PracticeConfig, QuestionItem } from '@/types';

export default function PracticeSessionPage() {
  const router = useRouter();
  const { selectedLessons, selectedTypes, questionCount } = useUIStore();

  const { questions, loading } = useQuestionPool(selectedLessons);
  const hasVoice = useJapaneseVoice();

  const audioKeys = useMemo(
    () => new Set(hasVoice ? ['tts'] : []),
    [hasVoice],
  );

  const maxLearnedLesson = useMemo(
    () => (selectedLessons.length > 0 ? Math.max(...selectedLessons) : 0),
    [selectedLessons],
  );

  const config: PracticeConfig = useMemo(
    () => ({
      mode: 'lesson',
      lessons: selectedLessons,
      maxLearnedLesson,
      selectedTypes,
      questionCount,
    }),
    [selectedLessons, maxLearnedLesson, selectedTypes, questionCount],
  );

  // Lưu danh sách câu hỏi đã dựng cố định cho toàn phiên
  const [prevQuestions, setPrevQuestions] = useState<QuestionItem[] | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<QuestionItem[] | null>(null);

  if (!loading && questions !== prevQuestions) {
    setPrevQuestions(questions);
    if (questions.length > 0) {
      const { questions: sessionList } = buildSession(questions, config, audioKeys);
      setSessionQuestions(sessionList);
    } else {
      setSessionQuestions([]);
    }
  }

  // Chuyển hướng nếu không có bài nào được chọn (ví dụ tải lại trang mất store)
  useEffect(() => {
    if (selectedLessons.length === 0) {
      router.replace('/luyen-tap');
    }
  }, [selectedLessons.length, router]);

  if (selectedLessons.length === 0) {
    return null;
  }

  // Đang nạp dữ liệu câu hỏi. hasVoice === null nghĩa là còn đang dò giọng ja-JP: dựng phiên
  // lúc này sẽ chốt audioKeys rỗng và loại sạch câu nghe trên máy thật ra CÓ giọng, mà bể câu
  // không đổi nữa nên không bao giờ dựng lại (SPEC-04 §B.5).
  if (hasVoice === null || loading || (questions.length > 0 && sessionQuestions === null)) {
    return (
      <main className="fixed inset-0 z-40 mx-auto flex w-full max-w-xl flex-col bg-background justify-between px-4 py-6">
        <div className="flex items-center justify-between">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-4 w-16" />
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

  // Không có câu hỏi nào hợp lệ
  if (!sessionQuestions || sessionQuestions.length === 0) {
    return (
      <main className="fixed inset-0 z-40 mx-auto flex w-full max-w-xl flex-col bg-background items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">
          Không có câu hỏi nào hợp lệ với lựa chọn hiện tại.
        </p>
        <Button size="quiz" onClick={() => router.push('/luyen-tap')}>
          Quay lại chọn bài
        </Button>
      </main>
    );
  }

  return (
    <PracticeRunner
      questions={sessionQuestions}
      config={config}
    />
  );
}
