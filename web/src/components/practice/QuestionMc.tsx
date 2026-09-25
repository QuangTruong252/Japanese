'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnswerOption, type AnswerOptionState } from './AnswerOption';
import type { QuestionProps } from './types';
import { checkOptionAnswer, targetTypeFromId } from '@/lib/practice';

export function QuestionMc({ question, answered, onAnswer }: QuestionProps) {
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
    if (checkOptionAnswer(option, question)) return 'correct';
    return chosen === option ? 'incorrect' : 'idle';
  };

  useEffect(() => {
    if (answered) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      const num = Number(e.key);
      if (num >= 1 && num <= options.length) {
        e.preventDefault();
        pick(options[num - 1]!);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [answered, options, pick]);

  return (
    <div className="flex flex-col gap-3" role="group">
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
