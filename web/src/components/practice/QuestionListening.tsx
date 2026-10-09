'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Volume2 } from 'lucide-react';
import { Chip } from '@/components/PaperKit';
import { Button } from '@/components/ui/button';
import { JpInput } from './JpInput';
import type { QuestionProps } from './types';
import { checkTextAnswer, targetTypeFromId } from '@/lib/practice';
import { toKanaSentence } from '@/lib/japanese';
import { speak } from '@/lib/tts';

export function QuestionListening({
  question,
  answered,
  onAnswer,
}: QuestionProps) {
  const [value, setValue] = useState('');
  const [rate, setRate] = useState<number>(1.0);

  // prompt của dạng nghe là notation furigana (sinh từ example.jp), không phải kana.
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
        userAnswer: value.trim(),
      },
    ]);
  };

  const handleDontKnow = () => {
    if (answered) return;
    onAnswer([
      {
        targetId: question.targetId,
        targetType: targetTypeFromId(question.targetId),
        isCorrect: false,
        elapsedMs: 0,
        usedHint: false,
        userAnswer: '',
      },
    ]);
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    speak(spoken, newRate);
  };

  const state: 'idle' | 'correct' | 'incorrect' = !answered
    ? 'idle'
    : checkTextAnswer(value, question)
      ? 'correct'
      : 'incorrect';

  return (
    <div className="flex flex-col gap-6">
      {/* Vùng phát audio: nút tròn 56px (không đỏ đặc: màn chỉ có một nút son) và hai chip tốc độ */}
      <div className="flex flex-col items-center justify-center gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={play}
          aria-label="Phát lại"
          className="size-14 rounded-full border border-border bg-secondary p-0 text-primary hover:bg-muted"
        >
          <Volume2 className="size-7" />
        </Button>

        <div className="flex items-center gap-2">
          <Chip pressed={rate === 0.8} onClick={() => handleRateChange(0.8)}>
            0.8×
          </Chip>
          <Chip pressed={rate === 1.0} onClick={() => handleRateChange(1.0)}>
            1.0×
          </Chip>
        </div>
      </div>

      {/* Vùng nhập câu trả lời */}
      <div className="flex flex-col gap-4">
        <JpInput
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          disabled={answered}
          label="Đáp án nghe và nhập"
          state={state}
        />
        {!answered && (
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              size="quiz"
              className="w-full font-semibold"
              disabled={value.trim().length === 0}
              onClick={handleSubmit}
            >
              Kiểm tra
              <ArrowRight aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="quiz"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={handleDontKnow}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.code === 'Space') {
                  e.preventDefault();
                  play();
                }
              }}
            >
              Chưa biết
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
