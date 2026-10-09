'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { LazyMotion, MotionConfig, domMax } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhraseToken } from './PhraseToken';
import { Furigana } from '@/components/Furigana';
import type { QuestionProps } from './types';
import { checkReorderAnswer, targetTypeFromId } from '@/lib/practice';
import { cn } from '@/lib/utils';

// Chạm để chọn/bỏ; khối từ bay giữa kho và thanh trả lời (shared layout).
// ponytail: chưa kéo để đổi thứ tự — Reorder của framer-motion chỉ hỗ trợ một hàng,
// thanh trả lời xuống dòng; thêm khi có cách kéo cho hàng wrap.
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

  const handleSubmit = useCallback(() => {
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
  }, [answered, chosenIds.length, tokens.length, chosenTokens, question, onAnswer]);

  useEffect(() => {
    if (answered) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.key !== 'Enter') return;

      // Bỏ qua nếu có dialog/modal đang mở
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;

      const target = e.target as HTMLElement | null;
      // Ưu tiên hành vi control đang focus: bỏ qua mọi control tương tác
      if (
        target?.closest(
          'button, a, input, textarea, select, [contenteditable="true"], [role="button"]',
        )
      ) {
        return;
      }

      if (chosenIds.length === tokens.length) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [answered, chosenIds.length, tokens.length, handleSubmit]);

  const isCorrect = answered
    ? checkReorderAnswer(
        chosenTokens.map((t) => t.text),
        question,
      )
    : null;

  return (
    <LazyMotion features={domMax} strict>
    <MotionConfig reducedMotion="user">
    <div className="flex flex-col gap-4">
      {/* Thanh trả lời: vùng chứa các khối từ đã chọn */}
      <div
        className={cn(
          'flex min-h-20 w-full flex-wrap items-center gap-2 rounded-xl border-2 p-3 transition-colors duration-150',
          !answered && 'border-dashed border-border bg-transparent',
          answered && isCorrect && 'border-success bg-success/10',
          answered && !isCorrect && 'border-destructive bg-destructive/10 motion-safe:animate-jp-shake',
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
              layoutId={token.id}
              disabled={answered}
              onClick={() => handleRemove(token.id)}
            >
              {/* khối từ tách từ example.jp: vẫn là notation furigana */}
              <Furigana text={token.text} zoomable={false} />
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
              key={used ? `${token.id}-slot` : token.id}
              layoutId={used ? undefined : token.id}
              used={used}
              disabled={answered}
              onClick={() => handlePick(token.id)}
            >
              {/* khối từ tách từ example.jp: vẫn là notation furigana */}
              <Furigana text={token.text} zoomable={false} />
            </PhraseToken>
          );
        })}
      </div>

      {/* Nút kiểm tra */}
      {!answered && (
        <Button
          size="quiz"
          className="w-full font-semibold"
          disabled={chosenIds.length !== tokens.length}
          onClick={handleSubmit}
        >
          Kiểm tra
          <ArrowRight aria-hidden="true" />
        </Button>
      )}
    </div>
    </MotionConfig>
    </LazyMotion>
  );
}
