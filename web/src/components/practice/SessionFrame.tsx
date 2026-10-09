'use client';

import type { ReactNode } from 'react';
import { ArrowRight, Check, Lightbulb, Pause, Play, X } from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import { SpeakButton } from '@/components/SpeakButton';
import { TornCard } from '@/components/PaperKit';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { answerText } from '@/lib/practice';
import { particleHint } from '@/lib/practice-draft';
import { containsJapanese, stripFurigana } from '@/lib/japanese';
import { cn } from '@/lib/utils';
import type { AnswerResult, QuestionItem } from '@/types';

/** Khung chung của phiên luyện tập và phiên ôn tập: toàn màn, nội dung căn giữa. */

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SessionShell({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <main className="fixed inset-0 z-40 bg-background">
      <div
        className={cn(
          'mx-auto flex h-full w-full max-w-2xl flex-col px-4 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] sm:px-6',
          className,
        )}
      >
        {children}
      </div>
    </main>
  );
}

/** Đầu phiên: nút thoát, tiến độ mảnh, tạm dừng + đồng hồ, bộ đếm câu. */
export function SessionHeader({
  regionLabel,
  exitLabel,
  onExit,
  index,
  total,
  progress,
  duration,
  isPaused,
  pauseLabel,
  pauseDisabled,
  onTogglePause,
}: {
  regionLabel: string;
  exitLabel: string;
  onExit: () => void;
  /** Số thứ tự câu đang làm, từ 0. */
  index: number;
  total: number;
  /** Phần đã xong, 0..1. */
  progress: number;
  duration: number;
  isPaused: boolean;
  pauseLabel: string;
  pauseDisabled?: boolean;
  onTogglePause: () => void;
}) {
  return (
    <div role="group" aria-label={regionLabel} className="flex h-16 shrink-0 items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 shrink-0 rounded-full border border-border bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={onExit}
        aria-label={exitLabel}
      >
        <X className="size-5" aria-hidden="true" />
      </Button>

      <div
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuetext={`Câu ${index + 1} trên ${total}`}
        className="mx-1 h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full origin-left bg-primary transition-transform duration-250 ease-smooth-out"
          style={{ transform: `scaleX(${Math.min(1, Math.max(0, progress))})` }}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 shrink-0 rounded-full border border-border bg-secondary text-foreground hover:bg-muted"
        onClick={onTogglePause}
        disabled={pauseDisabled}
        aria-label={pauseLabel}
      >
        {isPaused ? <Play className="size-5" aria-hidden="true" /> : <Pause className="size-5" aria-hidden="true" />}
      </Button>
      <span className="w-9 shrink-0 text-sm tabular-nums text-muted-foreground">{formatDuration(duration)}</span>
      <span className="h-5 w-px shrink-0 bg-border" aria-hidden="true" />
      <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
        {index + 1}/{total}
      </span>
    </div>
  );
}

/** Lớp tạm dừng phủ vùng câu hỏi: câu hỏi vẫn nằm dưới nên giữ nguyên chữ đang gõ. */
export function PauseLayer({
  title,
  resumeLabel,
  onResume,
}: {
  title: string;
  resumeLabel: string;
  onResume: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background p-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150">
      <div className="w-full max-w-sm">
        <TornCard className="space-y-4 text-center">
          <h2 className="font-serif text-xl font-semibold text-foreground">{title}</h2>
          <Button size="quiz" className="w-full font-semibold" onClick={onResume}>
            <Play aria-hidden="true" />
            {resumeLabel}
          </Button>
        </TornCard>
      </div>
    </div>
  );
}

function questionInstruction(question: QuestionItem): string {
  if (question.context) return question.context;
  switch (question.type) {
    case 'mc':
      return 'Chọn nghĩa đúng';
    case 'cloze':
      return 'Điền từ thích hợp vào chỗ trống';
    case 'listening':
      return 'Nghe và nhập lại câu tiếng Nhật';
    case 'matching':
      return 'Ghép các cặp từ tương ứng';
    case 'reorder':
      return 'Sắp xếp các từ thành câu hoàn chỉnh';
    default:
      return 'Chọn đáp án đúng';
  }
}

/** Chỉ dẫn nhỏ xám và đề bài lớn, căn giữa. Dạng nghe không có đề chữ: đề là âm thanh. */
export function QuestionPrompt({ question }: { question: QuestionItem }) {
  const isJp = containsJapanese(question.prompt);
  const isShort = stripFurigana(question.prompt).length <= 12;
  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-sm text-muted-foreground">{questionInstruction(question)}</p>
      {question.type !== 'listening' &&
        (isJp ? (
          <Furigana
            text={question.prompt}
            className={cn(
              'jp-display mt-3 max-w-full justify-center font-bold text-foreground',
              isShort ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl',
            )}
          />
        ) : (
          <p className="mt-3 max-w-full break-words font-serif text-2xl font-semibold text-foreground sm:text-3xl">
            {question.prompt}
          </p>
        ))}
    </div>
  );
}

/** Khối phản hồi sau khi trả lời: kết quả, đáp án, gợi ý, giải thích và nút sang câu tiếp. */
export function FeedbackPanel({
  question,
  result,
  isLast,
  onNext,
}: {
  question: QuestionItem;
  result: AnswerResult;
  isLast: boolean;
  onNext: () => void;
}) {
  const correct = result.isCorrect;
  const userAnswer = result.userAnswer?.trim() ?? '';
  const hint = !correct && result.userAnswer ? particleHint(result.userAnswer, question.answer) : null;
  const correctAnswerText =
    question.type === 'matching' && question.pairs
      ? question.pairs.map((p) => `${p.jp} ↔ ${p.vi}`).join(' · ')
      : answerText(question.answer);

  return (
    <div className="shrink-0 pt-2">
      {/* Cuộn riêng khi giải thích dài để nút "Tiếp tục" không bị đẩy ra khỏi màn nhỏ */}
      <div
        role="region"
        aria-label="Phản hồi kết quả"
        aria-live="polite"
        className="max-h-[60dvh] overflow-y-auto px-1 pb-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:duration-250 motion-safe:ease-smooth-out"
      >
        <TornCard className="space-y-3 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-full',
                  correct ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive',
                )}
              >
                {correct ? (
                  <Check className="size-6 stroke-[2.5]" aria-hidden="true" />
                ) : (
                  <X className="size-6 stroke-[2.5]" aria-hidden="true" />
                )}
              </span>
              <span className={cn('text-lg font-semibold', correct ? 'text-success' : 'text-destructive')}>
                {correct ? 'Đúng rồi' : 'Chưa đúng'}
              </span>
            </div>

            {containsJapanese(question.prompt) && question.type !== 'listening' && (
              <SpeakButton
                text={stripFurigana(question.prompt)}
                label="câu hỏi"
                className="size-11 min-w-11 rounded-full border border-border bg-secondary text-primary hover:bg-muted"
              />
            )}
          </div>

          {(question.explanationJp || question.explanationVi) && (
            <div className="space-y-1 rounded-lg bg-muted/40 p-3">
              {question.explanationJp && (
                <Furigana
                  text={question.explanationJp}
                  className="jp-example font-medium leading-loose text-foreground"
                />
              )}
              {question.explanationVi && (
                <p className="text-sm text-muted-foreground">{question.explanationVi}</p>
              )}
            </div>
          )}

          {!correct && question.type !== 'mc' && (
            <div className="space-y-1 text-sm">
              {userAnswer.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Bạn trả lời: </span>
                  <Furigana text={userAnswer} zoomable={false} className="jp font-medium text-destructive line-through" />
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Đáp án đúng: </span>
                <Furigana text={correctAnswerText} zoomable={false} className="jp font-medium text-success" />
              </div>
            </div>
          )}

          {hint && (
            <p className="flex items-start gap-2 rounded-lg border border-info/30 bg-info/10 p-2 text-xs text-foreground">
              <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-info" aria-hidden="true" />
              <span>
                <span className="font-semibold">Gợi ý:</span> {hint}
              </span>
            </p>
          )}

          <Button size="quiz" className="w-full font-semibold" onClick={onNext}>
            {isLast ? 'Xem kết quả' : 'Tiếp tục'}
            <ArrowRight aria-hidden="true" />
          </Button>
        </TornCard>
      </div>
    </div>
  );
}

/** Màn giữa chỗ chữ ngắn + nút: trống, bị chặn. Một nút chính, còn lại outline/ghost do người gọi chọn. */
export function SessionNotice({ message, children }: { message: string; children: ReactNode }) {
  return (
    <SessionShell className="items-center justify-center">
      <div className="w-full max-w-sm">
        <TornCard className="space-y-4 text-center">
          <p className="text-base text-foreground">{message}</p>
          <div className="flex flex-col gap-2">{children}</div>
        </TornCard>
      </div>
    </SessionShell>
  );
}

export function SessionSkeleton() {
  return (
    <SessionShell>
      <div className="flex h-16 shrink-0 items-center gap-2">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="mx-1 h-1.5 flex-1 rounded-full" />
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="my-auto space-y-8">
        <div className="space-y-3 text-center">
          <Skeleton className="mx-auto h-4 w-40" />
          <Skeleton className="mx-auto h-10 w-56" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    </SessionShell>
  );
}
