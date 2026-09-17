'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { JpInput } from './JpInput';
import type { QuestionProps } from './types';
import { checkTextAnswer, targetTypeFromId } from '@/lib/practice';

export function QuestionCloze({ question, answered, onAnswer }: QuestionProps) {
  const [value, setValue] = useState('');

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

  const state: 'idle' | 'correct' | 'incorrect' = !answered
    ? 'idle'
    : checkTextAnswer(value, question)
      ? 'correct'
      : 'incorrect';

  return (
    <div className="flex flex-col gap-3">
      <JpInput
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        disabled={answered}
        label="Đáp án điền từ"
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
  );
}
