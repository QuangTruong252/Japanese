'use client';

import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PracticeRunner } from '@/components/practice/PracticeRunner';
import { SessionNotice, SessionSkeleton } from '@/components/practice/SessionFrame';
import { buildSession } from '@/lib/practice';
import { useUIStore } from '@/lib/store';
import { useJapaneseVoice, useQuestionPool } from '@/lib/use-question-pool';
import { draftMatchesMode, loadPracticeDraft, wasNewSessionRequested } from '@/lib/practice-draft';
import type { PracticeConfig } from '@/types';

function ResumedSession() {
  const router = useRouter();
  // Đọc nháp MỘT lần khi mount, không subscribe nháp đang sống. Nháp ôn chỉ mở được ở /on-tap/phien.
  const [draft] = useState(() => {
    const saved = loadPracticeDraft();
    return draftMatchesMode(saved, 'lesson') ? saved : null;
  });

  useEffect(() => {
    if (!draft || draft.questions.length === 0) {
      router.replace('/luyen-tap');
    }
  }, [draft, router]);

  if (!draft || draft.questions.length === 0) {
    return <SessionSkeleton />;
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
  const { questions, loading, error, retry } = useQuestionPool(selectedLessons);
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

  // Không kẹt skeleton khi nạp dữ liệu bài lỗi
  if (error) {
    return (
      <SessionNotice message="Không tải được câu hỏi.">
        <Button size="quiz" className="w-full font-semibold" onClick={retry}>
          Thử lại
        </Button>
        <Button size="quiz" variant="outline" className="w-full" onClick={() => router.push('/luyen-tap')}>
          Quay lại chọn bài
        </Button>
      </SessionNotice>
    );
  }

  // Đang nạp dữ liệu câu hỏi cho phiên mới
  if (hasVoice === null || loading || (questions.length > 0 && sessionQuestions === null)) {
    return <SessionSkeleton />;
  }

  // Không có câu hỏi nào hợp lệ
  if (!sessionQuestions || sessionQuestions.length === 0) {
    return (
      <SessionNotice message="Không có câu hỏi nào hợp lệ với lựa chọn hiện tại.">
        <Button size="quiz" className="w-full font-semibold" onClick={() => router.push('/luyen-tap')}>
          Quay lại chọn bài
          <ArrowRight aria-hidden="true" />
        </Button>
      </SessionNotice>
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

  if (!mounted) {
    return <SessionSkeleton />;
  }

  // Không phải vừa bấm "Bắt đầu" => khôi phục nháp tại chỗ (ResumedSession tự về /luyen-tap
  // nếu không có nháp). Token resume đổi => remount runner sạch (làm lại câu sai).
  if (!startNew) {
    return <ResumedSession key={resumeToken ?? 'draft'} />;
  }

  return <NewSession />;
}

export default function PracticeSessionPage() {
  return (
    <Suspense fallback={<SessionSkeleton />}>
      <PracticeSessionContent />
    </Suspense>
  );
}
