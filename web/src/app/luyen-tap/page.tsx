'use client';

import { Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { filterExercises } from '@/lib/filter';
import { AVAILABLE_N5_LESSONS, loadLessonSummaries } from '@/lib/lessons';
import { buildSession } from '@/lib/practice';
import {
  loadSavedPracticePreset,
  loadSettings,
  saveSettings,
  type PracticePreset,
} from '@/lib/settings';
import { useUIStore } from '@/lib/store';
import { useJapaneseVoice, useQuestionPool } from '@/lib/use-question-pool';
import { cn } from '@/lib/utils';
import {
  clearPracticeDraft,
  getPracticeDraftSnapshot,
  markNewSessionRequested,
  subscribePracticeDraft,
} from '@/lib/practice-draft';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { countLearnedByLesson, pickActiveLesson } from '@/lib/stats';
import {
  computeActualQuestionCount,
  formatPracticeSummaryTitle,
  getPracticeBlockedReason,
  getPracticeStartButtonText,
  resolveInitialPracticeConfig,
} from '@/lib/practice-preview';
import PracticeDraftBanner from '@/components/practice/PracticeDraftBanner';
import type { ExerciseType, PracticeConfig } from '@/types';

const EXERCISE_TYPES: { type: ExerciseType; label: string }[] = [
  { type: 'mc', label: 'Trắc nghiệm' },
  { type: 'matching', label: 'Ghép cặp' },
  { type: 'cloze', label: 'Điền từ' },
  { type: 'reorder', label: 'Sắp xếp' },
  { type: 'listening', label: 'Nghe' },
];

const QUESTION_COUNTS = [10, 15, 20, 30];

function PracticeConfigContent() {
  const router = useRouter();
  // Prefetch sẵn để vào phiên được cả khi mất mạng sau khi trang đã tải.
  useEffect(() => {
    router.prefetch('/luyen-tap/phien');
  }, [router]);
  const searchParams = useSearchParams();

  const {
    selectedLessons,
    setSelectedLessons,
    selectedTypes,
    setSelectedTypes,
    questionCount,
    setQuestionCount,
  } = useUIStore();

  const [summaries, setSummaries] = useState<{ number: number; vocabCount: number }[]>([]);
  const [lessonTitles, setLessonTitles] = useState<Record<number, string>>({});
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [confirmNewSessionOpen, setConfirmNewSessionOpen] = useState(false);

  const customizeButtonRef = useRef<HTMLButtonElement>(null);
  const initializedRef = useRef(false);
  const userInteractedRef = useRef(false);
  const lastSavedJsonRef = useRef<string>('');

  // Lắng nghe bản nháp hiện tại để ưu tiên tiếp tục và cảnh báo khi bắt đầu phiên mới
  const draft = useSyncExternalStore(
    subscribePracticeDraft,
    getPracticeDraftSnapshot,
    () => null,
  );
  const hasActiveDraft = Boolean(draft && draft.currentIndex < draft.questions.length);

  // Tiến độ từ vựng theo bài học để tính bài đang học cục bộ
  const vocabTargetIds = useLiveQuery(
    () => db.reviewItems.where('targetType').equals('vocab').primaryKeys(),
    [],
    [] as string[],
  );
  const learnedByLesson = useMemo(
    () => countLearnedByLesson(vocabTargetIds ?? []),
    [vocabTargetIds],
  );

  // 1. Tải danh sách tóm tắt bài để hiển thị tiêu đề và tính activeLessonNum
  useEffect(() => {
    let active = true;
    loadLessonSummaries()
      .then((data) => {
        if (!active) return;
        setSummaries(data);
        const titles: Record<number, string> = {};
        for (const s of data) {
          titles[s.number] = s.title.vi;
        }
        setLessonTitles(titles);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // 2. Khởi tạo store ban đầu theo thứ tự ưu tiên (SPEC-19 §2):
  // ?lessons=N thắng -> preset hợp lệ -> bài đang học cục bộ -> Bài 1
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const lessonsParam = searchParams.get('lessons');
    const typeParam = searchParams.get('type') as ExerciseType | null;
    const savedPreset = loadSavedPracticePreset();
    const settings = loadSettings();
    const activeLessonNum = pickActiveLesson(
      summaries,
      learnedByLesson,
      settings.learnedThroughLesson,
    );

    const initial = resolveInitialPracticeConfig({
      lessonsParam,
      typeParam,
      savedPreset,
      activeLessonNum,
    });

    setSelectedLessons(initial.lessons);
    setSelectedTypes(initial.types);
    setQuestionCount(initial.questionCount);

    lastSavedJsonRef.current = JSON.stringify(initial);
  }, [
    searchParams,
    summaries,
    learnedByLesson,
    setSelectedLessons,
    setSelectedTypes,
    setQuestionCount,
  ]);

  // Cập nhật bài đang học cho người dùng mới khi Dexie/summaries tải xong (nếu chưa từng tùy chỉnh)
  useEffect(() => {
    if (userInteractedRef.current) return;
    const lessonsParam = searchParams.get('lessons');
    if (lessonsParam) return;
    const savedPreset = loadSavedPracticePreset();
    if (savedPreset && savedPreset.lessons.length > 0) return;

    if (summaries.length > 0) {
      const settings = loadSettings();
      const active = pickActiveLesson(
        summaries,
        learnedByLesson,
        settings.learnedThroughLesson,
      );
      if (active >= 1 && active <= 25) {
        setSelectedLessons([active]);
      }
    }
  }, [summaries, learnedByLesson, searchParams, setSelectedLessons]);

  const { questions, loading: poolLoading } = useQuestionPool(selectedLessons);
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

  const sessionPreview = useMemo(() => {
    if (selectedLessons.length === 0 || selectedTypes.length === 0) {
      return { eligibleCount: 0, excludedAudioCount: 0 };
    }
    return buildSession(questions, config, audioKeys);
  }, [questions, config, audioKeys, selectedLessons.length, selectedTypes.length]);

  const loading = poolLoading || hasVoice === null;

  // 3. Tính số câu sẵn có cho từng dạng bài và xác định dạng bị vô hiệu hóa
  const typeAvailability = useMemo(() => {
    const result: Record<
      ExerciseType,
      { count: number; disabled: boolean; reason?: string }
    > = {
      mc: { count: 0, disabled: false },
      matching: { count: 0, disabled: false },
      cloze: { count: 0, disabled: false },
      reorder: { count: 0, disabled: false },
      listening: { count: 0, disabled: false },
    };

    for (const { type } of EXERCISE_TYPES) {
      if (selectedLessons.length === 0) {
        result[type] = { count: 0, disabled: true, reason: 'Chưa chọn bài' };
      } else {
        const { eligibleQuestions, excludedAudioCount } = filterExercises(
          questions,
          {
            mode: 'lesson',
            lessons: selectedLessons,
            maxLearnedLesson,
            selectedTypes: [type],
            questionCount: 999999,
          },
          audioKeys,
        );
        const count = eligibleQuestions.length;
        if (count === 0) {
          const reason =
            type === 'listening' && excludedAudioCount > 0
              ? 'Thiếu giọng tiếng Nhật'
              : 'Chưa có câu';
          result[type] = { count: 0, disabled: true, reason };
        } else {
          result[type] = { count, disabled: false };
        }
      }
    }
    return result;
  }, [questions, selectedLessons, maxLearnedLesson, audioKeys]);

  // 4. Lưu preset vào settings khi người dùng chủ động thay đổi cấu hình
  useEffect(() => {
    if (!userInteractedRef.current) return;

    const currentPreset: PracticePreset = {
      lessons: selectedLessons,
      types: selectedTypes,
      questionCount,
    };
    const currentJson = JSON.stringify(currentPreset);
    if (currentJson !== lastSavedJsonRef.current) {
      lastSavedJsonRef.current = currentJson;
      saveSettings({ practicePreset: currentPreset });
    }
  }, [selectedLessons, selectedTypes, questionCount]);

  const toggleLesson = (num: number) => {
    userInteractedRef.current = true;
    if (selectedLessons.includes(num)) {
      setSelectedLessons(selectedLessons.filter((n) => n !== num));
    } else {
      setSelectedLessons([...selectedLessons, num].sort((a, b) => a - b));
    }
  };

  const selectAllLessons = () => {
    userInteractedRef.current = true;
    setSelectedLessons([...AVAILABLE_N5_LESSONS]);
  };

  const clearAllLessons = () => {
    userInteractedRef.current = true;
    setSelectedLessons([]);
  };

  const toggleType = (type: ExerciseType) => {
    if (typeAvailability[type]?.disabled) return;
    userInteractedRef.current = true;
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleSetQuestionCount = (count: number) => {
    userInteractedRef.current = true;
    setQuestionCount(count);
  };

  const actualQuestionCount = computeActualQuestionCount(
    questionCount,
    sessionPreview.eligibleCount,
  );

  const blockedReason = useMemo(
    () =>
      getPracticeBlockedReason({
        selectedLessons,
        selectedTypes,
        eligibleCount: sessionPreview.eligibleCount,
        loading,
      }),
    [selectedLessons, selectedTypes, sessionPreview.eligibleCount, loading],
  );

  const startButtonText = useMemo(
    () => getPracticeStartButtonText(actualQuestionCount, blockedReason),
    [actualQuestionCount, blockedReason],
  );

  const summaryTitle = useMemo(
    () =>
      formatPracticeSummaryTitle(
        selectedLessons,
        actualQuestionCount,
        selectedTypes.length,
      ),
    [selectedLessons, actualQuestionCount, selectedTypes.length],
  );

  const summarySubtitle = useMemo(() => {
    if (selectedLessons.length === 0) {
      return 'Vui lòng chọn ít nhất một bài học.';
    }
    if (selectedTypes.length === 0) {
      return 'Vui lòng chọn ít nhất một dạng bài.';
    }
    if (loading) {
      return 'Đang nạp kho câu hỏi…';
    }
    if (sessionPreview.eligibleCount === 0) {
      return 'Không có câu hỏi nào phù hợp với bộ lọc hiện tại.';
    }
    const audioNote =
      sessionPreview.excludedAudioCount > 0
        ? ` · ${sessionPreview.excludedAudioCount} câu nghe bị loại (thiếu giọng tiếng Nhật)`
        : '';
    if (sessionPreview.eligibleCount < questionCount) {
      return `Kho chỉ có ${sessionPreview.eligibleCount} câu phù hợp${audioNote}`;
    }
    return `Kho có ${sessionPreview.eligibleCount} câu phù hợp${audioNote}`;
  }, [
    selectedLessons.length,
    selectedTypes.length,
    loading,
    sessionPreview.eligibleCount,
    sessionPreview.excludedAudioCount,
    questionCount,
  ]);

  const handleToggleCustomize = () => {
    setIsCustomizing((prev) => {
      const next = !prev;
      if (!next) {
        setTimeout(() => {
          customizeButtonRef.current?.focus();
        }, 0);
      }
      return next;
    });
  };

  const handleCloseCustomize = () => {
    setIsCustomizing(false);
    setTimeout(() => {
      customizeButtonRef.current?.focus();
    }, 0);
  };

  const handleStartClick = () => {
    if (blockedReason || actualQuestionCount === 0) return;
    if (hasActiveDraft) {
      setConfirmNewSessionOpen(true);
      return;
    }
    markNewSessionRequested();
    router.push('/luyen-tap/phien');
  };

  const handleConfirmNewSession = () => {
    setConfirmNewSessionOpen(false);
    clearPracticeDraft();
    markNewSessionRequested();
    router.push('/luyen-tap/phien');
  };

  return (
    <main className="mx-auto w-full max-w-xl lg:max-w-2xl space-y-4 px-4 py-6 pb-28 sm:pb-12">
      <h1 className="font-heading text-xl font-medium">Luyện tập</h1>

      {/* 1. Banner nháp đang dở nếu có (ưu tiên) */}
      <PracticeDraftBanner />

      {/* 2. Card tóm tắt nhanh + CTA chính (luôn nằm trên màn đầu 390x844) */}
      <section
        aria-label="Cấu hình luyện tập nhanh"
        className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-xs"
      >
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Sẵn sàng luyện tập
          </span>
          <h2 className="text-lg font-semibold text-foreground">
            {summaryTitle}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {summarySubtitle}
          </p>
        </div>

        {/* Nút Bắt đầu M câu */}
        <div className="space-y-2">
          {blockedReason && (
            <p
              id="practice-blocked-reason"
              className="text-sm text-destructive"
              role="alert"
            >
              {blockedReason}
            </p>
          )}
          <Button
            size="quiz"
            className="w-full text-base font-semibold"
            disabled={Boolean(blockedReason) || loading}
            aria-describedby={blockedReason ? 'practice-blocked-reason' : undefined}
            onClick={handleStartClick}
          >
            {loading ? 'Đang chuẩn bị câu hỏi…' : startButtonText}
          </Button>
        </div>

        {/* Nút bật/tắt Tùy chỉnh */}
        <div className="pt-1 flex items-center justify-between border-t border-border/60">
          <Button
            ref={customizeButtonRef}
            type="button"
            variant="ghost"
            size="sm"
            aria-expanded={isCustomizing}
            aria-controls="practice-customize-panel"
            className="h-9 px-3 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground -ml-2"
            onClick={handleToggleCustomize}
          >
            <SlidersHorizontal className="mr-1.5 size-4" />
            <span>{isCustomizing ? 'Ẩn tùy chỉnh' : 'Tùy chỉnh bài, dạng và số câu'}</span>
            <ChevronDown
              className={cn(
                'ml-1.5 size-4 transition-transform duration-200',
                isCustomizing && 'rotate-180',
              )}
            />
          </Button>
        </div>
      </section>

      {/* 3. Panel Tùy chỉnh (hiển thị khi isCustomizing = true) */}
      {isCustomizing && (
        <section
          id="practice-customize-panel"
          aria-label="Tùy chỉnh chi tiết bài học, dạng bài và số lượng câu"
          className="space-y-6 rounded-2xl border border-border bg-card p-4 sm:p-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-200"
        >
          {/* Chọn bài (N5) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Chọn bài (N5)</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  onClick={selectAllLessons}
                >
                  Chọn tất cả
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  onClick={clearAllLessons}
                >
                  Bỏ chọn tất cả
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_N5_LESSONS.map((num) => {
                const selected = selectedLessons.includes(num);
                const title = lessonTitles[num];
                return (
                  <button
                    key={num}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`Bài ${num}${title ? `: ${title}` : ''}`}
                    onClick={() => toggleLesson(num)}
                    className={cn(
                      'flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors duration-150 ease-out outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px',
                      selected
                        ? 'border-2 border-primary bg-accent text-foreground'
                        : 'border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold',
                        selected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground',
                      )}
                    >
                      {num}
                    </span>
                    <span
                      className={cn(
                        'truncate text-xs',
                        selected ? 'font-medium text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {title || `Bài ${num}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chọn dạng bài */}
          <div className="space-y-3">
            <span className="text-sm font-medium text-foreground">Dạng bài</span>
            <div className="flex flex-wrap gap-2">
              {EXERCISE_TYPES.map(({ type, label }) => {
                const selected = selectedTypes.includes(type);
                const avail = typeAvailability[type];
                const isDisabled = avail?.disabled ?? false;
                const count = avail?.count ?? 0;
                const reason = avail?.reason;

                return (
                  <button
                    key={type}
                    type="button"
                    disabled={isDisabled}
                    aria-pressed={selected}
                    aria-disabled={isDisabled}
                    title={reason}
                    onClick={() => toggleType(type)}
                    className={cn(
                      'flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors duration-150 ease-out outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px',
                      isDisabled
                        ? 'cursor-not-allowed border border-border/60 bg-muted/40 text-muted-foreground/60'
                        : selected
                          ? 'border-2 border-primary bg-accent text-foreground'
                          : 'border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    <span>{label}</span>
                    <span className="text-xs opacity-80">
                      {isDisabled && reason ? `(${count} · ${reason})` : `(${count})`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Số lượng câu */}
          <div className="space-y-3">
            <span className="text-sm font-medium text-foreground">Số câu</span>
            <div className="flex flex-wrap gap-2">
              {QUESTION_COUNTS.map((count) => {
                const selected = questionCount === count;
                return (
                  <button
                    key={count}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => handleSetQuestionCount(count)}
                    className={cn(
                      'flex min-h-11 min-w-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-150 ease-out outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px',
                      selected
                        ? 'border-2 border-primary bg-accent text-foreground'
                        : 'border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    {count}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dòng tóm tắt kho câu trong panel */}
          <div className="space-y-1.5 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              {selectedLessons.length === 0 || selectedTypes.length === 0
                ? 'Chưa chọn đủ điều kiện tạo phiên luyện tập.'
                : `Kho có ${sessionPreview.eligibleCount} câu phù hợp${
                    sessionPreview.excludedAudioCount > 0
                      ? ` · ${sessionPreview.excludedAudioCount} câu nghe bị loại (thiếu giọng tiếng Nhật)`
                      : ''
                  }`}
            </p>
          </div>

          {/* Nút Đóng tùy chỉnh */}
          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCloseCustomize}
            >
              Xong
            </Button>
          </div>
        </section>
      )}

      {/* 4. Hộp thoại xác nhận ghi đè phiên nháp đang dở */}
      <AlertDialog
        open={confirmNewSessionOpen}
        onOpenChange={setConfirmNewSessionOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bắt đầu phiên luyện tập mới?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn đang có một {draft?.config?.mode === 'due' ? 'phiên ôn tập' : 'phiên luyện'} dở dang (câu{' '}
              {draft ? draft.currentIndex + 1 : 1}/{draft?.questions.length ?? 0}
              ). Bắt đầu mới sẽ thay thế và xóa bỏ bài làm dở này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel onClick={() => setConfirmNewSessionOpen(false)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmNewSession}
            >
              Bắt đầu mới
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

export default function PracticeConfigPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-xl lg:max-w-2xl space-y-4 px-4 py-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </main>
      }
    >
      <PracticeConfigContent />
    </Suspense>
  );
}
