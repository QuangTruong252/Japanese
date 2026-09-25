'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { filterExercises } from '@/lib/filter';
import { AVAILABLE_N5_LESSONS, loadLessonSummaries } from '@/lib/lessons';
import { buildSession } from '@/lib/practice';
import {
  loadSettings,
  saveSettings,
  VALID_PRACTICE_EXERCISE_TYPES,
} from '@/lib/settings';
import { useUIStore } from '@/lib/store';
import { useJapaneseVoice, useQuestionPool } from '@/lib/use-question-pool';
import { cn } from '@/lib/utils';
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
  const searchParams = useSearchParams();

  const {
    selectedLessons,
    setSelectedLessons,
    selectedTypes,
    setSelectedTypes,
    questionCount,
    setQuestionCount,
  } = useUIStore();

  const [lessonTitles, setLessonTitles] = useState<Record<number, string>>({});
  const initializedRef = useRef(false);
  const lastSavedJsonRef = useRef<string>('');

  // 1. Tải danh sách tóm tắt bài để hiển thị tên ngắn tiếng Việt
  useEffect(() => {
    let active = true;
    loadLessonSummaries()
      .then((summaries) => {
        if (!active) return;
        const titles: Record<number, string> = {};
        for (const s of summaries) {
          titles[s.number] = s.title.vi;
        }
        setLessonTitles(titles);
      })
      .catch(() => {
        // Dự phòng khi lỗi nạp tóm tắt
      });
    return () => {
      active = false;
    };
  }, []);

  // 2. Khởi tạo store từ preset trong settings và ưu tiên query params nếu có
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const settings = loadSettings();
    const preset = settings.practicePreset;

    const lessonsParam = searchParams.get('lessons');
    let initialLessons = preset.lessons;
    if (lessonsParam) {
      const parsedLessons = lessonsParam
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= 25);
      if (parsedLessons.length > 0) {
        initialLessons = [...new Set(parsedLessons)].sort((a, b) => a - b);
      }
    }

    const typeParam = searchParams.get('type') as ExerciseType | null;
    let initialTypes = preset.types;
    if (typeParam && VALID_PRACTICE_EXERCISE_TYPES.includes(typeParam)) {
      initialTypes = [typeParam];
    }

    const initialCount = preset.questionCount;

    setSelectedLessons(initialLessons);
    setSelectedTypes(initialTypes);
    setQuestionCount(initialCount);

    lastSavedJsonRef.current = JSON.stringify({
      lessons: initialLessons,
      types: initialTypes,
      questionCount: initialCount,
    });
  }, [searchParams, setSelectedLessons, setSelectedTypes, setQuestionCount]);

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

  const sessionPreview = useMemo(() => {
    if (selectedLessons.length === 0 || selectedTypes.length === 0) {
      return { eligibleCount: 0, excludedAudioCount: 0 };
    }
    return buildSession(questions, config, audioKeys);
  }, [questions, config, audioKeys, selectedLessons.length, selectedTypes.length]);

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

  // 4. Tự động bỏ chọn dạng bài nếu dạng đó có 0 câu cho các bài đang chọn
  useEffect(() => {
    if (!initializedRef.current || loading || selectedLessons.length === 0) return;

    const invalid = selectedTypes.filter((t) => typeAvailability[t]?.disabled);
    if (invalid.length > 0) {
      const nextTypes = selectedTypes.filter((t) => !typeAvailability[t]?.disabled);
      setSelectedTypes(nextTypes);
    }
  }, [loading, selectedLessons.length, selectedTypes, typeAvailability, setSelectedTypes]);

  // 5. Lưu preset vào settings khi cấu hình thay đổi
  useEffect(() => {
    if (!initializedRef.current) return;

    const currentPreset = {
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
    if (selectedLessons.includes(num)) {
      setSelectedLessons(selectedLessons.filter((n) => n !== num));
    } else {
      setSelectedLessons([...selectedLessons, num].sort((a, b) => a - b));
    }
  };

  const selectAllLessons = () => {
    setSelectedLessons([...AVAILABLE_N5_LESSONS]);
  };

  const clearAllLessons = () => {
    setSelectedLessons([]);
  };

  const toggleType = (type: ExerciseType) => {
    if (typeAvailability[type]?.disabled) return;
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const blockedReason = useMemo(() => {
    if (selectedLessons.length === 0) {
      return 'Chưa chọn bài nào.';
    }
    if (selectedTypes.length === 0) {
      return 'Chưa chọn dạng bài nào.';
    }
    if (!loading && sessionPreview.eligibleCount === 0) {
      return 'Không có câu nào hợp lệ với lựa chọn hiện tại. Thử chọn thêm bài hoặc thêm dạng bài.';
    }
    return null;
  }, [selectedLessons.length, selectedTypes.length, loading, sessionPreview.eligibleCount]);

  const actualQuestionCount = Math.min(questionCount, sessionPreview.eligibleCount);

  const startButtonText = useMemo(() => {
    if (blockedReason || actualQuestionCount === 0) {
      return 'Bắt đầu';
    }
    return `Bắt đầu ${actualQuestionCount} câu`;
  }, [blockedReason, actualQuestionCount]);

  return (
    <main className="mx-auto max-w-xl space-y-6 px-4 py-6">
      {/* TODO(W3): <PracticeDraftBanner /> */}

      <h1 className="font-heading text-xl font-medium">Luyện tập</h1>

      {/* Chọn bài */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Chọn bài (N5)</span>
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
      </section>

      {/* Chọn dạng bài */}
      <section className="space-y-3">
        <span className="text-sm font-medium">Dạng bài</span>
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
      </section>

      {/* Số lượng câu */}
      <section className="space-y-3">
        <span className="text-sm font-medium">Số câu</span>
        <div className="flex flex-wrap gap-2">
          {QUESTION_COUNTS.map((count) => {
            const selected = questionCount === count;
            return (
              <button
                key={count}
                type="button"
                aria-pressed={selected}
                onClick={() => setQuestionCount(count)}
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
      </section>

      {/* Dòng tóm tắt và nhắc nhở */}
      <section className="space-y-1.5 border-t border-border pt-4">
        {loading ? (
          <Skeleton className="h-5 w-48" />
        ) : (
          <p className="text-sm text-muted-foreground">
            {selectedLessons.length === 0 || selectedTypes.length === 0
              ? 'Chưa chọn đủ điều kiện tạo phiên luyện tập.'
              : `Kho có ${sessionPreview.eligibleCount} câu phù hợp${
                  sessionPreview.excludedAudioCount > 0
                    ? ` · ${sessionPreview.excludedAudioCount} câu nghe bị loại (máy không có giọng tiếng Nhật)`
                    : ''
                }`}
          </p>
        )}
      </section>

      {/* Nút bắt đầu và cảnh báo chặn */}
      <div className="space-y-2 pt-2">
        {blockedReason && (
          <p className="text-center text-sm text-destructive" role="alert">
            {blockedReason}
          </p>
        )}
        {loading ? (
          <Skeleton className="h-12 w-full rounded-xl" />
        ) : (
          <Button
            size="quiz"
            className="w-full"
            disabled={Boolean(blockedReason)}
            onClick={() => router.push('/luyen-tap/phien')}
          >
            {startButtonText}
          </Button>
        )}
      </div>
    </main>
  );
}

export default function PracticeConfigPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-xl space-y-6 px-4 py-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </main>
      }
    >
      <PracticeConfigContent />
    </Suspense>
  );
}
