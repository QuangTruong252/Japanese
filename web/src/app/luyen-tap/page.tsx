'use client';

import { Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, ChevronDown, SlidersHorizontal, Trash2 } from 'lucide-react';
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
import { PaperSlip } from '@/components/PaperStage';
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
  clearNewSessionRequest,
  clearPracticeDraft,
  getPracticeDraftSnapshot,
  markNewSessionRequested,
  subscribePracticeDraft,
} from '@/lib/practice-draft';
import { getActivePracticeDraftInfo } from '@/lib/active-drafts';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { countLearnedByLesson, pickActiveLesson } from '@/lib/stats';
import {
  computeActualQuestionCount,
  getPracticeBlockedReason,
  getPracticeStartButtonText,
  resolveInitialPracticeConfig,
} from '@/lib/practice-preview';
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
  const [confirmNewSessionOpen, setConfirmNewSessionOpen] = useState(false);
  const [confirmDiscardDraftOpen, setConfirmDiscardDraftOpen] = useState(false);

  const initializedRef = useRef(false);
  const userInteractedRef = useRef(false);
  const lastSavedJsonRef = useRef<string>('');

  // Lắng nghe bản nháp hiện tại để ưu tiên tiếp tục và cảnh báo khi bắt đầu phiên mới
  const draft = useSyncExternalStore(
    subscribePracticeDraft,
    getPracticeDraftSnapshot,
    () => null,
  );
  const draftInfo = useMemo(() => {
    return getActivePracticeDraftInfo(draft);
  }, [draft]);
  const hasActiveDraft = Boolean(draftInfo);

  const draftLabel = useMemo(() => {
    if (!draftInfo) return '';
    if (draftInfo.label === 'Ôn tập') return 'Ôn tập';
    const typeLabel =
      draft?.config?.selectedTypes?.length === 1
        ? EXERCISE_TYPES.find((t) => t.type === draft.config?.selectedTypes?.[0])?.label
        : null;
    const lessonPart =
      draftInfo.selectedLessons && draftInfo.selectedLessons.length > 0
        ? draftInfo.selectedLessons.length === 1
          ? `Bài ${draftInfo.selectedLessons[0]}`
          : `Bài ${draftInfo.selectedLessons.join(', ')}`
        : '';
    if (typeLabel && lessonPart) {
      return `${typeLabel} ${lessonPart}`;
    }
    return lessonPart || typeLabel || 'Luyện tập';
  }, [draft, draftInfo]);

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

  // 2. Khởi tạo store ban đầu theo thứ tự ưu tiên:
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
          result[type] = { count, disabled: true, reason };
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

  const summaryTitle = useMemo(() => {
    if (selectedLessons.length === 0) {
      return 'Chưa chọn bài học';
    }
    const lessonText =
      selectedLessons.length === 1
        ? `Bài ${selectedLessons[0]}`
        : selectedLessons.length === 25
          ? 'Tất cả 25 bài'
          : `Bài ${selectedLessons.join(', ')}`;
    return `${lessonText} · ${actualQuestionCount} câu`;
  }, [selectedLessons, actualQuestionCount]);

  const selectedTypeLabels = useMemo(() => {
    if (selectedTypes.length === 0) {
      return 'Chưa chọn dạng bài';
    }
    return selectedTypes
      .map((t) => EXERCISE_TYPES.find((item) => item.type === t)?.label)
      .filter(Boolean)
      .join(', ');
  }, [selectedTypes]);

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

  const handleResumeDraft = () => {
    if (!draftInfo) return;
    clearNewSessionRequest();
    router.push(draftInfo.resumeHref);
  };

  const handleDiscardDraft = () => {
    setConfirmDiscardDraftOpen(true);
  };

  const handleConfirmDiscardDraft = () => {
    setConfirmDiscardDraftOpen(false);
    clearPracticeDraft();
  };

  return (
    <main className="mx-auto w-full max-w-xl space-y-4 px-4 py-6 pb-28 sm:pb-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Luyện tập
        </h1>
        <p className="text-sm text-muted-foreground">
          Tùy biến bài học và dạng bài để củng cố kiến thức N5.
        </p>
      </header>

      {/* 1 & 2. Phiên dở dang và Cấu hình luyện tập (Finding 23 & Finding 25: một slip duy nhất, giữ scale Latin 24/14/12px) */}
      {hasActiveDraft && draftInfo ? (
        <>
          <PaperSlip className="mt-0 space-y-3 border-primary/30">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Phiên dở dang
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Phiên dở · {draftLabel} · câu {draftInfo.currentQuestionIndex}/{draftInfo.totalQuestions}
              </h2>
              <p className="text-xs text-muted-foreground">
                {draftInfo.label === 'Ôn tập'
                  ? 'Luyện phiên mới sẽ thay thế phiên ôn này. Hãy ôn xong trước, hoặc bỏ nháp.'
                  : 'Tiếp tục bài làm dở dang hoặc chọn cấu hình mới bên dưới.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <Button
                type="button"
                size="quiz"
                className="w-full sm:flex-1 text-sm font-semibold"
                onClick={handleResumeDraft}
              >
                {draftInfo.label === 'Ôn tập' ? 'Tiếp tục phiên ôn' : 'Tiếp tục'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="quiz"
                className="w-full sm:w-auto text-xs text-muted-foreground hover:text-destructive"
                onClick={handleDiscardDraft}
              >
                <Trash2 className="mr-1.5 size-4" />
                Bỏ nháp
              </Button>
            </div>
          </PaperSlip>

          <section aria-label="Cấu hình phiên mới" className="border-t border-border py-4 space-y-3">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cấu hình phiên mới
              </span>
              <h3 className="text-base font-semibold text-foreground">
                {summaryTitle}
              </h3>
              <p className="text-xs text-muted-foreground">
                {selectedTypeLabels}
              </p>
            </div>

            {blockedReason && (
              <div
                id="practice-blocked-reason"
                className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
                role="alert"
              >
                <p className="font-medium">{blockedReason}</p>
                {sessionPreview.eligibleCount === 0 &&
                  selectedLessons.length > 0 &&
                  selectedTypes.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Gợi ý: Chọn thêm bài học hoặc bỏ dạng Nghe nếu máy chưa có giọng Nhật.
                    </p>
                  )}
              </div>
            )}

            <Button
              size="quiz"
              variant="outline"
              className="w-full text-sm font-semibold"
              disabled={Boolean(blockedReason) || loading}
              aria-describedby={blockedReason ? 'practice-blocked-reason' : undefined}
              onClick={handleStartClick}
            >
              {loading ? 'Đang chuẩn bị câu hỏi…' : startButtonText}
            </Button>
          </section>
        </>
      ) : (
        <PaperSlip className="mt-0 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cấu hình luyện tập
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {summaryTitle}
            </h2>
            <p className="text-xs text-muted-foreground">
              {selectedTypeLabels}
            </p>
          </div>

          {blockedReason && (
            <div
              id="practice-blocked-reason"
              className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
              role="alert"
            >
              <p className="font-medium">{blockedReason}</p>
              {sessionPreview.eligibleCount === 0 &&
                selectedLessons.length > 0 &&
                selectedTypes.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Gợi ý: Chọn thêm bài học hoặc bỏ dạng Nghe nếu máy chưa có giọng Nhật.
                  </p>
                )}
            </div>
          )}

          <Button
            size="quiz"
            variant="default"
            className="w-full text-sm font-semibold"
            disabled={Boolean(blockedReason) || loading}
            aria-describedby={blockedReason ? 'practice-blocked-reason' : undefined}
            onClick={handleStartClick}
          >
            {loading ? 'Đang chuẩn bị câu hỏi…' : startButtonText}
          </Button>
        </PaperSlip>
      )}

      {/* 3. Collapsible Tùy chỉnh (dòng hairline không khung) */}
      <details className="group border-t border-border">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4" />
            <span>Tùy chỉnh bài, dạng và số câu</span>
          </div>
          <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" />
        </summary>

        <div className="space-y-6 pt-2 pb-4">
          {/* Chọn bài 1–25 theo hàng 5 cột */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Chọn bài (N5)</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 min-h-12 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={selectAllLessons}
                >
                  Chọn tất cả
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 min-h-12 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={clearAllLessons}
                >
                  Bỏ chọn
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
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
                      'flex min-h-12 items-center justify-center gap-1 rounded-xl text-sm font-medium transition-colors duration-150 ease-out outline-none focus-visible:ring-3 focus-visible:ring-ring active:translate-y-px',
                      selected
                        ? 'border-2 border-primary bg-accent text-accent-foreground font-semibold'
                        : 'border border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )}
                  >
                    {selected && (
                      <Check className="size-3.5 shrink-0 text-accent-foreground" aria-hidden="true" />
                    )}
                    <span>{num}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chọn dạng bài: 5 chips (Finding 26: min-h-12 cho 48px touch target) */}
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
                      'flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors duration-150 ease-out outline-none focus-visible:ring-3 focus-visible:ring-ring active:translate-y-px',
                      isDisabled
                        ? 'cursor-not-allowed border border-border/60 bg-muted/40 text-muted-foreground/60'
                        : selected
                          ? 'border-2 border-primary bg-accent text-accent-foreground font-semibold'
                          : 'border border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )}
                  >
                    {selected && !isDisabled && (
                      <Check className="size-3.5 shrink-0 text-accent-foreground" aria-hidden="true" />
                    )}
                    <span>{label}</span>
                    <span className="text-xs opacity-75">
                      {isDisabled && reason ? `(${count} · ${reason})` : `(${count})`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chọn số câu: radio group với native inputs và labels 48px (Finding 24 & Finding 26) */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">Số câu</legend>
            <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-border bg-muted/40 p-1">
              {QUESTION_COUNTS.map((count) => {
                const selected = questionCount === count;
                const inputId = `question-count-${count}`;
                return (
                  <label
                    key={count}
                    htmlFor={inputId}
                    className={cn(
                      'relative flex min-h-12 cursor-pointer select-none items-center justify-center rounded-lg text-sm font-medium transition-colors duration-150 ease-out outline-none',
                      'has-focus-visible:ring-3 has-focus-visible:ring-ring',
                      selected
                        ? 'border border-border/60 bg-card font-semibold text-foreground shadow-xs'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )}
                  >
                    <input
                      type="radio"
                      id={inputId}
                      name="question-count"
                      value={count}
                      checked={selected}
                      onChange={() => handleSetQuestionCount(count)}
                      className="peer sr-only"
                    />
                    <span className="flex size-full items-center justify-center rounded-lg peer-focus-visible:ring-3 peer-focus-visible:ring-ring">
                      {count}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Dòng availability */}
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              {selectedLessons.length === 0 || selectedTypes.length === 0
                ? 'Chưa chọn đủ bài học và dạng bài.'
                : `Sẵn ${sessionPreview.eligibleCount} câu${
                    sessionPreview.excludedAudioCount > 0
                      ? ` · ${sessionPreview.excludedAudioCount} câu nghe bị loại (máy chưa có giọng Nhật)`
                      : ''
                  }`}
            </p>
          </div>
        </div>
      </details>

      {/* 4. Hộp thoại xác nhận bỏ phiên nháp đang dở (Finding 23) */}
      <AlertDialog
        open={confirmDiscardDraftOpen}
        onOpenChange={setConfirmDiscardDraftOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Bỏ phiên dở câu {draftInfo ? `${draftInfo.currentQuestionIndex}/${draftInfo.totalQuestions}` : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tiến độ bài làm hiện tại sẽ bị xóa hoàn toàn và không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel onClick={() => setConfirmDiscardDraftOpen(false)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDiscardDraft}
            >
              Bỏ phiên
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 5. Hộp thoại xác nhận ghi đè phiên nháp đang dở */}
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
        <main className="mx-auto w-full max-w-xl space-y-4 px-4 py-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </main>
      }
    >
      <PracticeConfigContent />
    </Suspense>
  );
}

