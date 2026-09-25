'use client';

import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PracticeRunner } from '@/components/practice/PracticeRunner';
import { buildSession } from '@/lib/practice';
import { useUIStore } from '@/lib/store';
import { useJapaneseVoice, useQuestionPool } from '@/lib/use-question-pool';
import { loadPracticeDraft, wasNewSessionRequested } from '@/lib/practice-draft';
import type { PracticeConfig } from '@/types';

function PracticeSessionLoading() {
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

function ResumedSession() {
  const router = useRouter();
  // Đọc nháp MỘT lần khi mount, không subscribe nháp đang sống
  const [draft] = useState(() => loadPracticeDraft());

  useEffect(() => {
    if (!draft || draft.questions.length === 0) {
      router.replace('/luyen-tap');
    }
  }, [draft, router]);

  if (!draft || draft.questions.length === 0) {
    return <PracticeSessionLoading />;
  }

  const resumeConfig: PracticeConfig = draft.config ?? {
    mode: 'lesson',
    lessons: [...new Set(draft.questions.map((q) => q.lesson))].sort((a, b) => a - b),
    maxLearnedLesson: Math.max(0, ...draft.questions.map((q) => q.lesson)),
    selectedTypes: [...new Set(draft.questions.map((q) => q.type))],
    questionCount: draft.questions.length,
  };

  return (
    <PracticeRunner
      questions={draft.questions}
      config={resumeConfig}
      initialIndex={draft.currentIndex}
      initialResults={draft.results}
      initialDuration={draft.elapsedSec}
    />
  );
}

function NewSession() {
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

  // Dựng danh sách câu hỏi cho phiên mới
  const sessionQuestions = useMemo(() => {
    if (loading || questions.length === 0) return null;
    const { questions: sessionList } = buildSession(questions, config, audioKeys);
    return sessionList;
  }, [loading, questions, config, audioKeys]);

  // Đang nạp dữ liệu câu hỏi cho phiên mới
  if (hasVoice === null || loading || (questions.length > 0 && sessionQuestions === null)) {
    return <PracticeSessionLoading />;
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

function PracticeSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeToken = searchParams.get('resume');

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { selectedLessons } = useUIStore();
  // Tải lại trang (iOS hay tự reload tab) làm store về mặc định: không được dựng phiên mới
  // đè lên nháp. Chỉ dựng phiên mới khi vừa bấm "Bắt đầu" trong lần tải trang này.
  const startNew = !resumeToken && wasNewSessionRequested() && selectedLessons.length > 0;

  useEffect(() => {
    if (!mounted || resumeToken || startNew) return;
    const existingDraft = loadPracticeDraft();
    if (existingDraft && existingDraft.questions.length > 0) {
      router.replace(`/luyen-tap/phien?resume=${Date.now()}`);
    } else {
      router.replace('/luyen-tap');
    }
  }, [mounted, resumeToken, startNew, router]);

  if (!mounted) {
    return <PracticeSessionLoading />;
  }

  // 1. Quyết định khôi phục CHỈ bằng query resume
  if (resumeToken) {
    return <ResumedSession key={resumeToken} />;
  }

  if (!startNew) {
    return <PracticeSessionLoading />;
  }

  return <NewSession />;
}

export default function PracticeSessionPage() {
  return (
    <Suspense fallback={<PracticeSessionLoading />}>
      <PracticeSessionContent />
    </Suspense>
  );
}
