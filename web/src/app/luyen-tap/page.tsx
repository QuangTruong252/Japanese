'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AVAILABLE_N5_LESSONS } from '@/lib/lessons';
import { buildSession } from '@/lib/practice';
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

export default function PracticeConfigPage() {
  const router = useRouter();

  const {
    selectedLessons,
    setSelectedLessons,
    selectedTypes,
    setSelectedTypes,
    questionCount,
    setQuestionCount,
  } = useUIStore();

  const { questions, unverifiedLessons, loading } = useQuestionPool(selectedLessons);
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

  return (
    <main className="mx-auto max-w-xl space-y-6 px-4 py-6">
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

        <div className="flex flex-wrap gap-2">
          {AVAILABLE_N5_LESSONS.map((num) => {
            const selected = selectedLessons.includes(num);
            return (
              <button
                key={num}
                type="button"
                aria-pressed={selected}
                aria-label={`Bài ${num}`}
                onClick={() => toggleLesson(num)}
                className={cn(
                  'flex size-11 min-h-11 min-w-11 items-center justify-center rounded-xl text-sm font-medium transition-colors duration-150 ease-out outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px',
                  selected
                    ? 'border-2 border-primary bg-accent text-foreground'
                    : 'border border-border bg-card text-muted-foreground [@media(hover:hover)]:hover:bg-accent [@media(hover:hover)]:hover:text-foreground',
                )}
              >
                {num}
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
            return (
              <button
                key={type}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleType(type)}
                className={cn(
                  'flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-150 ease-out outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px',
                  selected
                    ? 'border-2 border-primary bg-accent text-foreground'
                    : 'border border-border bg-card text-muted-foreground [@media(hover:hover)]:hover:bg-accent [@media(hover:hover)]:hover:text-foreground',
                )}
              >
                {label}
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
                    : 'border border-border bg-card text-muted-foreground [@media(hover:hover)]:hover:bg-accent [@media(hover:hover)]:hover:text-foreground',
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
              : `Sẵn ${sessionPreview.eligibleCount} câu${
                  sessionPreview.excludedAudioCount > 0
                    ? ` · ${sessionPreview.excludedAudioCount} câu nghe bị loại (máy không có giọng tiếng Nhật)`
                    : ''
                }`}
          </p>
        )}
        {unverifiedLessons.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Nội dung các bài này chưa được đối chiếu với bản in.
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
            Bắt đầu
          </Button>
        )}
      </div>
    </main>
  );
}
