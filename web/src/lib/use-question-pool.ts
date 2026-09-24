'use client';

import { useEffect, useState } from 'react';
import { loadLessons, loadVocabMap } from './lessons.ts';
import { generateQuestions } from './questions.ts';
import { hasJapaneseVoice } from './tts.ts';
import type { QuestionItem } from '../types/index.ts';

/**
 * Nạp dữ liệu bài đã chọn rồi sinh bể câu hỏi. generateQuestions đã memoize theo tập bài nên
 * đổi qua lại giữa các lựa chọn không sinh lại từ đầu.
 */
interface Pool {
  key: string;
  questions: QuestionItem[];
}

const EMPTY_POOL: Pool = { key: '', questions: [] };

export function useQuestionPool(lessons: number[]): {
  questions: QuestionItem[];
  loading: boolean;
} {
  // Một state duy nhất mang theo key của bể câu đang giữ. `loading` SUY RA từ việc key đó đã
  // khớp lựa chọn hiện tại chưa — không phải một state riêng. Gọi setState thẳng trong thân
  // effect vi phạm react-hooks/set-state-in-effect và làm `pnpm check` exit 1.
  const [pool, setPool] = useState<Pool>(EMPTY_POOL);
  const key = [...lessons].sort((a, b) => a - b).join(',');

  useEffect(() => {
    let alive = true;
    const nums = key.length === 0 ? [] : key.split(',').map(Number);
    if (nums.length === 0) {
      Promise.resolve().then(() => {
        if (alive) setPool(EMPTY_POOL);
      });
      return;
    }
    Promise.all([loadLessons(nums), loadVocabMap(nums)]).then(([lessonData, vocabMap]) => {
      if (!alive) return;
      setPool({
        key,
        questions: generateQuestions(lessonData, vocabMap),
      });
    });
    return () => {
      alive = false;
    };
  }, [key]);

  return {
    questions: pool.questions,
    loading: pool.key !== key,
  };
}

/** null = đang dò giọng. `availableAudioKeys` của SPEC-01 §5 nghĩa là "máy có giọng ja-JP". */
export function useJapaneseVoice(): boolean | null {
  const [hasVoice, setHasVoice] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    hasJapaneseVoice().then((ok) => {
      if (alive) setHasVoice(ok);
    });
    return () => {
      alive = false;
    };
  }, []);
  return hasVoice;
}
