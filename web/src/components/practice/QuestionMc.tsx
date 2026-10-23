'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnswerOption, type AnswerOptionState } from './AnswerOption';
import type { QuestionProps } from './types';
import { checkOptionAnswer, targetTypeFromId } from '@/lib/practice';
import { optionKeyIndex } from '@/lib/session-keys';

export function QuestionMc({ question, answered, onAnswer, paused = false }: QuestionProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  const options = useMemo(() => question.options ?? [], [question.options]);

  const pick = useCallback(
    (option: string) => {
      if (answered) return;
      setChosen(option);
      // elapsedMs: 0 là cố ý — PracticeRunner giữ đồng hồ và ghi đè giá trị này.
      onAnswer([
        {
          targetId: question.targetId,
          targetType: targetTypeFromId(question.targetId),
          isCorrect: checkOptionAnswer(option, question),
          elapsedMs: 0,
          usedHint: false,
          userAnswer: option,
        },
      ]);
    },
    [answered, onAnswer, question],
  );

  const stateOf = (option: string): AnswerOptionState => {
    if (!answered) return chosen === option ? 'selected' : 'idle';
    const isThisCorrect = checkOptionAnswer(option, question);
    const wasChosenCorrect = chosen !== null && checkOptionAnswer(chosen, question);

    if (isThisCorrect) {
      return wasChosenCorrect ? 'correct' : 'revealed-correct';
    }
    return chosen === option ? 'incorrect' : 'idle';
  };

  useEffect(() => {
    if (answered || paused) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const i = optionKeyIndex(e, options.length);
      if (i !== null) {
        e.preventDefault();
        pick(options[i]!);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [answered, paused, options, pick]);

  return (
    <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2" role="group" aria-label="Các lựa chọn đáp án">
      {options.map((option, i) => (
        <AnswerOption
          key={option}
          index={i + 1}
          state={stateOf(option)}
          disabled={answered}
          onClick={() => pick(option)}
        >
          {option}
        </AnswerOption>
      ))}
    </div>
  );
}
