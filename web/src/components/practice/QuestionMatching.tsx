'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnswerOption, type AnswerOptionState } from './AnswerOption';
import { Furigana } from '@/components/Furigana';
import type { QuestionProps } from './types';
import { shuffle, targetTypeFromId } from '@/lib/practice';
import { cn } from '@/lib/utils';
import type { AnswerResult } from '@/types';

export function QuestionMatching({
  question,
  answered,
  onAnswer,
}: QuestionProps) {
  const pairs = useMemo(() => question.pairs ?? [], [question.pairs]);

  // Xáo trộn riêng từng cột bằng shuffle
  const leftItems = useMemo(
    () => shuffle(pairs.map((p) => ({ targetId: p.targetId, text: p.jp }))),
    [pairs],
  );
  const rightItems = useMemo(
    () => shuffle(pairs.map((p) => ({ targetId: p.targetId, text: p.vi }))),
    [pairs],
  );

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedTargetIds, setMatchedTargetIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [incorrectPair, setIncorrectPair] = useState<{
    leftTargetId: string;
    rightTargetId: string;
  } | null>(null);

  const failedTargetIdsRef = useRef<Set<string>>(new Set());
  const completedResultsRef = useRef<AnswerResult[]>([]);
  const lastMatchedAtRef = useRef<number>(0);
  const isResolvingRef = useRef<boolean>(false);

  // Khởi tạo mốc thời gian khi mount
  useEffect(() => {
    lastMatchedAtRef.current = performance.now();
    if (pairs.length === 0) {
      onAnswer([]);
    }
  }, [pairs.length, onAnswer]);

  const resolvePair = useCallback(
    (
      leftId: string,
      rightId: string,
      firstSelectedTargetId: string,
    ) => {
      const isMatch = leftId === rightId;

      if (isMatch) {
        const now = performance.now();
        const startTime = lastMatchedAtRef.current || now;
        const elapsedMs = Math.max(1, Math.round(now - startTime));
        lastMatchedAtRef.current = now;

        const targetId = leftId;
        const isCorrect = !failedTargetIdsRef.current.has(targetId);

        completedResultsRef.current.push({
          targetId,
          targetType: targetTypeFromId(targetId),
          isCorrect,
          elapsedMs,
          usedHint: false,
        });

        setMatchedTargetIds((prev) => {
          const next = new Set(prev);
          next.add(targetId);
          return next;
        });

        setSelectedLeft(null);
        setSelectedRight(null);

        // Khi đã chốt hết tất cả các cặp: gọi onAnswer MỘT LẦN duy nhất
        if (completedResultsRef.current.length === pairs.length) {
          onAnswer(completedResultsRef.current);
        }
      } else {
        // Cố tình ghép sai: ghi nhận mục tiêu đang giải quyết bị sai
        failedTargetIdsRef.current.add(firstSelectedTargetId);

        setIncorrectPair({ leftTargetId: leftId, rightTargetId: rightId });
        isResolvingRef.current = true;

        // Rung 300ms rồi trở về idle
        setTimeout(() => {
          setIncorrectPair(null);
          setSelectedLeft(null);
          setSelectedRight(null);
          isResolvingRef.current = false;
        }, 350);
      }
    },
    [onAnswer, pairs.length],
  );

  const handleLeftClick = useCallback(
    (targetId: string) => {
      if (
        answered ||
        matchedTargetIds.has(targetId) ||
        isResolvingRef.current
      ) {
        return;
      }

      // Nếu đã chọn ô bên phải -> Chốt cặp!
      if (selectedRight !== null) {
        resolvePair(targetId, selectedRight, selectedRight);
      } else {
        // Chọn ô trái hoặc đổi ô trái
        setSelectedLeft(targetId);
      }
    },
    [answered, matchedTargetIds, selectedRight, resolvePair],
  );

  const handleRightClick = useCallback(
    (targetId: string) => {
      if (
        answered ||
        matchedTargetIds.has(targetId) ||
        isResolvingRef.current
      ) {
        return;
      }

      // Nếu đã chọn ô bên trái -> Chốt cặp!
      if (selectedLeft !== null) {
        resolvePair(selectedLeft, targetId, selectedLeft);
      } else {
        // Chọn ô phải hoặc đổi ô phải
        setSelectedRight(targetId);
      }
    },
    [answered, matchedTargetIds, selectedLeft, resolvePair],
  );

  if (pairs.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-destructive">
        Dữ liệu bài tập ghép cặp không hợp lệ.
      </div>
    );
  }

  const stateOfLeft = (targetId: string): AnswerOptionState => {
    if (incorrectPair?.leftTargetId === targetId) return 'incorrect';
    if (matchedTargetIds.has(targetId)) return 'correct';
    if (selectedLeft === targetId) return 'selected';
    return 'idle';
  };

  const stateOfRight = (targetId: string): AnswerOptionState => {
    if (incorrectPair?.rightTargetId === targetId) return 'incorrect';
    if (matchedTargetIds.has(targetId)) return 'correct';
    if (selectedRight === targetId) return 'selected';
    return 'idle';
  };

  return (
    <div
      className="grid grid-cols-2 gap-3"
      role="group"
      aria-label="Ghép cặp từ vựng và nghĩa tiếng Việt"
    >
      {/* Cột trái: tiếng Nhật */}
      <div className="flex flex-col gap-3">
        {leftItems.map((item) => {
          const matched = matchedTargetIds.has(item.targetId);
          return (
            <div
              key={item.targetId}
              className={cn(matched && 'opacity-40 transition-opacity duration-200')}
            >
              <AnswerOption
                state={stateOfLeft(item.targetId)}
                disabled={matched || answered}
                onClick={() => handleLeftClick(item.targetId)}
              >
                {/* pairs[].jp là notation furigana, không phải chữ đã dựng ruby */}
                <Furigana text={item.text} zoomable={false} />
              </AnswerOption>
            </div>
          );
        })}
      </div>

      {/* Cột phải: tiếng Việt */}
      <div className="flex flex-col gap-3">
        {rightItems.map((item) => {
          const matched = matchedTargetIds.has(item.targetId);
          return (
            <div
              key={item.targetId}
              className={cn(matched && 'opacity-40 transition-opacity duration-200')}
            >
              <AnswerOption
                state={stateOfRight(item.targetId)}
                disabled={matched || answered}
                onClick={() => handleRightClick(item.targetId)}
              >
                {item.text}
              </AnswerOption>
            </div>
          );
        })}
      </div>
    </div>
  );
}
