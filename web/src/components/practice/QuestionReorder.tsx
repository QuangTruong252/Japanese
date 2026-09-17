'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PhraseToken } from './PhraseToken';
import type { QuestionProps } from './types';
import { checkReorderAnswer, targetTypeFromId } from '@/lib/practice';
import { cn } from '@/lib/utils';

// ponytail: chỉ 1-chạm; thêm kéo thả framer-motion khi có nhu cầu thật.
export function QuestionReorder({
  question,
  answered,
  onAnswer,
}: QuestionProps) {
  // Gắn id duy nhất cho từng token để xử lý trường hợp có các từ giống nhau trong câu
  const tokens = useMemo(() => {
    const rawOptions =
      question.options && question.options.length > 0
        ? question.options
        : Array.isArray(question.answer)
          ? question.answer
          : [question.answer];

    return rawOptions.map((text, idx) => ({
      id: `token-${idx}-${text}`,
      text,
    }));
  }, [question]);

  const [chosenIds, setChosenIds] = useState<string[]>([]);

  const handlePick = (id: string) => {
    if (answered) return;
    if (!chosenIds.includes(id)) {
      setChosenIds([...chosenIds, id]);
    }
  };

  const handleRemove = (id: string) => {
    if (answered) return;
    setChosenIds(chosenIds.filter((chosenId) => chosenId !== id));
  };

  const chosenTokens = chosenIds.map(
    (id) => tokens.find((token) => token.id === id)!,
  );

  const handleSubmit = () => {
    if (answered || chosenIds.length !== tokens.length) return;
    const chosenWords = chosenTokens.map((t) => t.text);
    const isCorrect = checkReorderAnswer(chosenWords, question);

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

  const isCorrect = answered
    ? checkReorderAnswer(
        chosenTokens.map((t) => t.text),
        question,
      )
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Thanh trả lời: vùng chứa các khối từ đã chọn */}
      <div
        className={cn(
          'flex min-h-16 w-full flex-wrap items-center gap-2 rounded-xl border-2 p-3 transition-colors duration-150',
          !answered && 'border-dashed border-border bg-card/50',
          answered && isCorrect && 'border-success bg-success/10',
          answered && !isCorrect && 'border-destructive bg-destructive/10 motion-safe:jp-shake',
        )}
      >
        {chosenTokens.length === 0 ? (
          <span className="text-sm text-muted-foreground select-none">
            Chạm vào từ bên dưới
          </span>
        ) : (
          chosenTokens.map((token) => (
            <PhraseToken
              key={token.id}
              disabled={answered}
              onClick={() => handleRemove(token.id)}
            >
              {token.text}
            </PhraseToken>
          ))
        )}
      </div>

      {/* Kho khối: các khối từ chưa dùng và đã dùng (giữ nguyên vị trí) */}
      <div className="flex flex-wrap gap-2">
        {tokens.map((token) => {
          const used = chosenIds.includes(token.id);
          return (
            <PhraseToken
              key={token.id}
              used={used}
              disabled={answered}
              onClick={() => handlePick(token.id)}
            >
              {token.text}
            </PhraseToken>
          );
        })}
      </div>

      {/* Nút kiểm tra */}
      {!answered && (
        <Button
          size="quiz"
          className="w-full"
          disabled={chosenIds.length !== tokens.length}
          onClick={handleSubmit}
        >
          Kiểm tra
        </Button>
      )}
    </div>
  );
}
