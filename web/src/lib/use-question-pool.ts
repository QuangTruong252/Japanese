'use client';

import { useCallback, useEffect, useState } from 'react';
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
  /** Lần thử mà bể này thuộc về; `retry` tăng số này để nạp lại cùng một lựa chọn. */
  attempt: number;
  questions: QuestionItem[];
  failed: boolean;
}

const EMPTY_POOL: Pool = { key: '', attempt: 0, questions: [], failed: false };

export function useQuestionPool(lessons: number[]): {
  questions: QuestionItem[];
  loading: boolean;
  /** Nạp dữ liệu bài thất bại (mạng/chunk lỗi): không còn `loading`, và `questions` rỗng. */
  error: boolean;
  retry: () => void;
} {
  // Một state duy nhất mang theo key của bể câu đang giữ. `loading` SUY RA từ việc key đó đã
  // khớp lựa chọn hiện tại chưa — không phải một state riêng. Gọi setState thẳng trong thân
  // effect vi phạm react-hooks/set-state-in-effect và làm `pnpm check` exit 1.
  const [pool, setPool] = useState<Pool>(EMPTY_POOL);
  const [attempt, setAttempt] = useState(0);
  const key = [...lessons].sort((a, b) => a - b).join(',');

  useEffect(() => {
    let alive = true;
    const nums = key.length === 0 ? [] : key.split(',').map(Number);
    if (nums.length === 0) {
      // Ghi theo `attempt` hiện tại: sau một lần thử lại, bể rỗng mang attempt 0 sẽ kẹt `loading`.
      Promise.resolve().then(() => {
        if (alive) setPool({ key, attempt, questions: [], failed: false });
      });
      return () => {
        alive = false;
      };
    }
    Promise.all([loadLessons(nums), loadVocabMap(nums)])
      .then(([lessonData, vocabMap]) => {
        if (!alive) return;
        setPool({ key, attempt, questions: generateQuestions(lessonData, vocabMap), failed: false });
      })
      // Không bắt lỗi thì `loading` kẹt true mãi và người dùng nhìn skeleton vô hạn.
      .catch(() => {
        if (alive) setPool({ key, attempt, questions: [], failed: true });
      });
    return () => {
      alive = false;
    };
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return {
    questions: pool.questions,
    loading: pool.key !== key || pool.attempt !== attempt,
    error: pool.failed && pool.key === key && pool.attempt === attempt,
    retry,
  };
}

/** null = đang dò giọng. `availableAudioKeys` nghĩa là "máy có giọng ja-JP". */
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
