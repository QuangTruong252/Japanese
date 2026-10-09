'use client';

import { Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowDownUp,
  ArrowRight,
  Headphones,
  Link2,
  ListChecks,
  PenLine,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
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
import { Chip, PageTitle, SectionHeader, TornCard } from '@/components/PaperKit';
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

const EXERCISE_TYPES: { type: ExerciseType; label: string; Icon: LucideIcon }[] = [
  { type: 'mc', label: 'Trắc nghiệm', Icon: ListChecks },
  { type: 'matching', label: 'Ghép cặp', Icon: Link2 },
  { type: 'cloze', label: 'Điền từ', Icon: PenLine },
  { type: 'reorder', label: 'Sắp xếp', Icon: ArrowDownUp },
  { type: 'listening', label: 'Nghe', Icon: Headphones },
];

const QUESTION_COUNTS = [10, 15, 20, 30];

const PILL_BUTTON =
  'inline-flex min-h-11 items-center rounded-full bg-secondary px-3 text-sm font-medium text-secondary-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring';

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

  const blockedAlert = blockedReason && (
    <div
      id="practice-blocked-reason"
      className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
      role="alert"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-medium">{blockedReason}</p>
        {sessionPreview.eligibleCount === 0 &&
          selectedLessons.length > 0 &&
          selectedTypes.length > 0 && (
            <p className="mt-1 text-muted-foreground">
              Gợi ý: Chọn thêm bài học hoặc bỏ dạng Nghe nếu máy chưa có giọng Nhật.
            </p>
          )}
      </div>
    </div>
  );

  // Có nháp thì "Tiếp tục" giữ nút đỏ duy nhất của màn; bắt đầu phiên mới hạ xuống outline.
  const startButton = (
    <Button
      size="quiz"
      variant={hasActiveDraft ? 'outline' : 'default'}
      className="mt-5 w-full font-semibold"
      disabled={Boolean(blockedReason) || loading}
      aria-describedby={blockedReason ? 'practice-blocked-reason' : undefined}
      onClick={handleStartClick}
    >
      {loading ? 'Đang chuẩn bị câu hỏi…' : startButtonText}
      {!loading && <ArrowRight aria-hidden="true" />}
    </Button>
  );

  const newSessionSummary = (
    <>
      <p className="font-serif text-2xl font-bold tracking-tight text-foreground">{summaryTitle}</p>
      <p className="mt-1 text-sm text-muted-foreground">{selectedTypeLabels}</p>
      {blockedAlert}
      {startButton}
    </>
  );

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 pb-12 pt-3 sm:px-6 lg:px-8">
      <PageTitle title="Luyện tập" />

      <div className="max-w-2xl space-y-8">
        {hasActiveDraft && draftInfo ? (
          <section aria-labelledby="practice-draft-heading" className="space-y-4">
            <TornCard>
              <p
                id="practice-draft-heading"
                className="font-serif text-sm font-bold tracking-wide text-primary"
              >
                / Phiên dở /
              </p>
              <p className="mt-1.5 font-serif text-2xl font-bold tracking-tight text-foreground">
                {draftLabel} · câu {draftInfo.currentQuestionIndex}/{draftInfo.totalQuestions}
              </p>
              {draftInfo.label === 'Ôn tập' && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Luyện phiên mới sẽ thay thế phiên ôn này. Hãy ôn xong trước, hoặc bỏ nháp.
                </p>
              )}
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  size="quiz"
                  className="w-full font-semibold sm:flex-1"
                  onClick={handleResumeDraft}
                >
                  {draftInfo.label === 'Ôn tập' ? 'Tiếp tục phiên ôn' : 'Tiếp tục'}
                  <ArrowRight aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="quiz"
                  className="w-full text-muted-foreground hover:text-destructive sm:w-auto"
                  onClick={handleDiscardDraft}
                >
                  <Trash2 aria-hidden="true" />
                  Bỏ nháp
                </Button>
              </div>
            </TornCard>
            <div aria-label="Cấu hình phiên mới" role="group" className="rounded-xl border border-border bg-card p-4">
              {newSessionSummary}
            </div>
          </section>
        ) : (
          <section aria-labelledby="practice-new-heading">
            <TornCard>
              <p
                id="practice-new-heading"
                className="font-serif text-sm font-bold tracking-wide text-primary"
              >
                / Phiên mới /
              </p>
              <div className="mt-1.5">{newSessionSummary}</div>
            </TornCard>
          </section>
        )}

        <section aria-labelledby="practice-lessons-heading">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <h2 id="practice-lessons-heading" className="text-lg font-semibold text-foreground">
              Chọn bài
            </h2>
            <div className="flex gap-2">
              <button type="button" className={PILL_BUTTON} onClick={selectAllLessons}>
                Chọn tất cả
              </button>
              <button type="button" className={PILL_BUTTON} onClick={clearAllLessons}>
                Bỏ chọn
              </button>
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
                    'flex h-12 items-center justify-center rounded-xl border text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring active:translate-y-px',
                    selected
                      ? 'border-primary bg-primary font-semibold text-primary-foreground'
                      : 'border-border bg-card text-foreground hover:bg-muted/60',
                  )}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="practice-types-heading">
          <SectionHeader id="practice-types-heading" title="Dạng bài" />
          <div className="flex flex-wrap gap-2">
            {EXERCISE_TYPES.map(({ type, label, Icon }) => {
              const avail = typeAvailability[type];
              const reason = avail?.reason;
              const count = avail?.count ?? 0;
              return (
                <Chip
                  key={type}
                  pressed={selectedTypes.includes(type)}
                  disabled={avail?.disabled ?? false}
                  title={reason}
                  icon={<Icon aria-hidden="true" />}
                  onClick={() => toggleType(type)}
                >
                  {label} {avail?.disabled && reason ? `(${count} · ${reason})` : `(${count})`}
                </Chip>
              );
            })}
          </div>
        </section>

        <fieldset>
          <legend className="mb-3 text-lg font-semibold text-foreground">Số câu</legend>
          <div className="grid grid-cols-4 gap-1 rounded-xl border border-border bg-card p-1">
            {QUESTION_COUNTS.map((count) => {
              const selected = questionCount === count;
              const inputId = `question-count-${count}`;
              return (
                <label
                  key={count}
                  htmlFor={inputId}
                  className={cn(
                    'relative flex min-h-11 cursor-pointer select-none items-center justify-center rounded-lg text-sm font-medium transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring',
                    selected
                      ? 'bg-primary font-semibold text-primary-foreground'
                      : 'text-foreground hover:bg-muted/60',
                  )}
                >
                  <input
                    type="radio"
                    id={inputId}
                    name="question-count"
                    value={count}
                    checked={selected}
                    onChange={() => handleSetQuestionCount(count)}
                    className="sr-only"
                  />
                  {count}
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {selectedLessons.length === 0 || selectedTypes.length === 0
              ? 'Chưa chọn đủ bài học và dạng bài.'
              : `Sẵn ${sessionPreview.eligibleCount} câu${
                  sessionPreview.excludedAudioCount > 0
                    ? ` · ${sessionPreview.excludedAudioCount} câu nghe bị loại (máy chưa có giọng Nhật)`
                    : ''
                }`}
          </p>
        </fieldset>
      </div>

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
        <main className="mx-auto w-full max-w-5xl space-y-8 px-4 pb-12 pt-3 sm:px-6 lg:px-8">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-56 w-full max-w-2xl rounded-xl" />
        </main>
      }
    >
      <PracticeConfigContent />
    </Suspense>
  );
}

