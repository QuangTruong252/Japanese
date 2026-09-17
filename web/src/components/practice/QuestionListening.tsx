'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JpInput } from './JpInput';
import type { QuestionProps } from './types';
import { checkTextAnswer, targetTypeFromId } from '@/lib/practice';
import { toKanaSentence } from '@/lib/japanese';
import { speak } from '@/lib/tts';
import { cn } from '@/lib/utils';

export function QuestionListening({
  question,
  answered,
  onAnswer,
}: QuestionProps) {
  const [value, setValue] = useState('');
  const [rate, setRate] = useState<number>(1.0);

  // prompt của dạng nghe là notation furigana (SPEC-01 sinh từ example.jp), không phải kana.
  // Đưa thẳng vào speechSynthesis thì máy đọc cả chữ Hán lẫn phần đọc trong ngoặc.
  const spoken = useMemo(() => toKanaSentence(question.prompt), [question.prompt]);

  const play = useCallback(() => {
    speak(spoken, rate);
  }, [spoken, rate]);

  // Tự phát một lần khi câu hiện lên
  useEffect(() => {
    speak(spoken, 1.0);
  }, [spoken]);

  // Phím Space để phát lại khi không focus trong input
  useEffect(() => {
    if (answered) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
      if (isInput) return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        play();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [answered, play]);

  const handleSubmit = () => {
    if (answered || value.trim().length === 0) return;
    const isCorrect = checkTextAnswer(value, question);
    onAnswer([
      {
        targetId: question.targetId,
        targetType: targetTypeFromId(question.targetId),
        isCorrect,
        elapsedMs: 0,
        usedHint: false,
      },
    ]);
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    speak(question.prompt, newRate);
  };

  const state: 'idle' | 'correct' | 'incorrect' = !answered
    ? 'idle'
    : checkTextAnswer(value, question)
      ? 'correct'
      : 'incorrect';

  return (
    <div className="flex flex-col gap-6">
      {/* Vùng phát audio: nút tròn 56px và hai chip tốc độ 44px */}
      <div className="flex flex-col items-center justify-center gap-3">
        <Button
          type="button"
          variant="default"
          onClick={play}
          aria-label="Phát lại"
          className="size-14 rounded-full p-0 shadow-sm"
        >
          <Volume2 className="size-7" />
        </Button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-pressed={rate === 0.8}
            onClick={() => handleRateChange(0.8)}
            className={cn(
              'flex h-11 min-w-11 items-center justify-center rounded-xl px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px',
              rate === 0.8
                ? 'border-2 border-primary bg-accent text-foreground'
                : 'border border-border bg-card text-muted-foreground [@media(hover:hover)]:hover:bg-accent [@media(hover:hover)]:hover:text-foreground',
            )}
          >
            0.8×
          </button>
          <button
            type="button"
            aria-pressed={rate === 1.0}
            onClick={() => handleRateChange(1.0)}
            className={cn(
              'flex h-11 min-w-11 items-center justify-center rounded-xl px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px',
              rate === 1.0
                ? 'border-2 border-primary bg-accent text-foreground'
                : 'border border-border bg-card text-muted-foreground [@media(hover:hover)]:hover:bg-accent [@media(hover:hover)]:hover:text-foreground',
            )}
          >
            1.0×
          </button>
        </div>
      </div>

      {/* Vùng nhập câu trả lời */}
      <div className="flex flex-col gap-3">
        <JpInput
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          disabled={answered}
          label="Đáp án nghe và nhập"
          state={state}
        />
        {!answered && (
          <Button
            size="quiz"
            className="w-full"
            disabled={value.trim().length === 0}
            onClick={handleSubmit}
          >
            Kiểm tra
          </Button>
        )}
      </div>
    </div>
  );
}
