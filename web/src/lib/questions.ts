import type { Lesson, VocabWord, QuestionItem } from '../types/index.ts';
import { stripFurigana } from './japanese.ts';
import { pickDistractors, type DistractorCandidate } from './distractors.ts';

export const CONFUSION_PARTICLES: Record<string, string[]> = {
  は: ['が', 'も', 'を', 'に', 'で'],
  が: ['は', 'を', 'に', 'も', 'で'],
  を: ['が', 'に', 'で', 'は', 'へ'],
  に: ['で', 'へ', 'を', 'が', 'と'],
  で: ['に', 'を', 'へ', 'は', 'と'],
  へ: ['に', 'で', 'まで', 'を', 'から'],
  と: ['や', 'に', 'も', 'で', 'は'],
  も: ['は', 'と', 'が', 'を', 'に'],
  から: ['まで', 'に', 'で', 'へ', 'と'],
  まで: ['から', 'に', 'へ', 'で', 'を'],
  や: ['と', 'も', 'の', 'に', 'で'],
};

const PARTICLE_ROMAJI: Record<string, string> = {
  は: 'wa',
  が: 'ga',
  を: 'wo',
  に: 'ni',
  で: 'de',
  へ: 'e',
  と: 'to',
  も: 'mo',
  から: 'kara',
  まで: 'made',
  や: 'ya',
};

export const PARTICLE_PATTERN = new RegExp(
  `(?<=\\]|[\\u30a1-\\u30f3\\u30fc])(${Object.keys(CONFUSION_PARTICLES).join('|')})(?=[ \\u30000-9\\uff10-\\uff19\\u4e00-\\u9fa5\\u3005\\u30a1-\\u30f3「])`,
  'g'
);

const BLANK = '＿＿＿';

export const buildAuxiliaryIndex = (vocabByLesson: Map<number, VocabWord[]>): Map<string, number> => {
  const index = new Map<string, number>();
  for (const [lesson, words] of vocabByLesson.entries()) {
    for (const w of words) {
      const surface = stripFurigana(w.word);
      if (surface) {
        index.set(surface, lesson);
      }
    }
  }
  return index;
};

export const extractAuxiliaryLessons = (sentence: string, index: Map<string, number>): number[] => {
  const stripped = stripFurigana(sentence);
  // Sắp xếp các từ khóa theo độ dài giảm dần (dài trước ngắn)
  const sortedKeys = Array.from(index.keys()).sort((a, b) => b.length - a.length);
  const lessons = new Set<number>();
  let remaining = stripped;

  for (const key of sortedKeys) {
    if (remaining.includes(key)) {
      lessons.add(index.get(key)!);
      remaining = remaining.split(key).join(' ');
    }
  }

  return Array.from(lessons).sort((a, b) => a - b);
};

const pad2 = (n: number | string): string => String(n).padStart(2, '0');

export const generateQuestions = (
  lessons: Lesson[],
  vocabByLesson: Map<number, VocabWord[]>
): QuestionItem[] => {
  const questions: QuestionItem[] = [];
  const auxIndex = buildAuxiliaryIndex(vocabByLesson);

  // Chuẩn bị distractor pool cho từ vựng
  const allVocabCandidates: DistractorCandidate[] = [];
  const allMeaningCandidates: { meaning: string; lesson: number }[] = [];

  for (const words of vocabByLesson.values()) {
    for (const w of words) {
      allVocabCandidates.push({
        kana: w.kana,
        type: w.type,
        stripped: stripFurigana(w.word),
      });
      if (w.meaning.vi) {
        allMeaningCandidates.push({ meaning: w.meaning.vi, lesson: w.lesson });
      }
    }
  }

  // 1. Dạng MC (Đọc & Nghĩa) từ Vocab
  for (const [lessonNum, words] of vocabByLesson.entries()) {
    words.forEach((word, idx) => {
      const targetId = `vocab-${pad2(lessonNum)}-${pad2(idx + 1)}`;
      const strippedWord = stripFurigana(word.word);

      // 1.1 MC Reading: prompt = stripped kanji, options = kana
      const readingDistractors = pickDistractors(
        { kana: word.kana, type: word.type, stripped: strippedWord },
        allVocabCandidates,
        3
      );
      questions.push({
        id: `mc-read-${targetId}`,
        type: 'mc',
        lesson: lessonNum,
        auxiliaryLessons: [lessonNum],
        targetId,
        prompt: strippedWord,
        context: 'Chọn cách đọc đúng của từ',
        options: [word.kana, ...readingDistractors].sort(),
        answer: word.kana,
      });

      // 1.2 MC Meaning: prompt = word with furigana, options = meaning.vi
      const otherMeanings = allMeaningCandidates
        .filter((c) => c.meaning !== word.meaning.vi)
        .map((c) => c.meaning);
      const meaningDistractors = otherMeanings
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      questions.push({
        id: `mc-mean-${targetId}`,
        type: 'mc',
        lesson: lessonNum,
        auxiliaryLessons: [lessonNum],
        targetId,
        prompt: word.word,
        context: 'Chọn nghĩa tiếng Việt chính xác',
        options: [word.meaning.vi, ...meaningDistractors].sort(),
        answer: word.meaning.vi,
      });
    });

    // 2. Dạng Matching từ Vocab (chia từng nhóm 4-5 từ cùng bài)
    for (let i = 0; i < words.length; i += 5) {
      const chunk = words.slice(i, i + 5);
      if (chunk.length >= 4) {
        questions.push({
          id: `matching-${pad2(lessonNum)}-${Math.floor(i / 5) + 1}`,
          type: 'matching',
          lesson: lessonNum,
          auxiliaryLessons: [lessonNum],
          targetId: `vocab-${pad2(lessonNum)}-${pad2(i + 1)}`,
          prompt: 'Ghép từ tiếng Nhật với nghĩa tiếng Việt tương ứng',
          options: chunk.map((w) => w.word),
          answer: chunk.map((w) => `${w.word}:::${w.meaning.vi}`),
        });
      }
    }
  }

  // 3. Dạng Cloze, Reorder, Listening từ Lesson Grammar & Examples
  for (const lesson of lessons) {
    const lessonNum = lesson.number;

    lesson.grammar.forEach((point, pointIdx) => {
      const grammarTargetId = `grammar-${pad2(lessonNum)}-${pad2(pointIdx + 1)}`;

      point.examples.forEach((example, exIdx) => {
        const auxLessons = extractAuxiliaryLessons(example.jp, auxIndex);
        if (!auxLessons.includes(lessonNum)) {
          auxLessons.push(lessonNum);
          auxLessons.sort((a, b) => a - b);
        }

        // 3.1 Cloze (Điền trợ từ)
        const matches = [...example.jp.matchAll(PARTICLE_PATTERN)];
        matches.forEach((match, matchIdx) => {
          const particle = match[1]!;
          const romaji = PARTICLE_ROMAJI[particle] ?? particle;
          const targetId = `particle-${romaji}`;
          const prompt = `${example.jp.slice(0, match.index)}${BLANK}${example.jp.slice(
            match.index! + particle.length
          )}`;

          const distractors = (CONFUSION_PARTICLES[particle] ?? [])
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

          questions.push({
            id: `cloze-${pad2(lessonNum)}-${point.id}-${exIdx}-${matchIdx}`,
            type: 'cloze',
            lesson: lessonNum,
            auxiliaryLessons: auxLessons,
            targetId,
            prompt,
            context: example.translation.vi,
            options: [particle, ...distractors].sort(),
            answer: particle,
            acceptedVariants: [particle],
            explanationVi: example.translation.vi,
            explanationJp: example.jp,
          });
        });

        // 3.2 Reorder (Sắp xếp câu: chỉ nhận câu có 4-6 khối bunsetsu)
        const blocks = example.jp.trim().split(/[ \u3000]+/);
        if (blocks.length >= 4 && blocks.length <= 6) {
          questions.push({
            id: `reorder-${pad2(lessonNum)}-${point.id}-${exIdx}`,
            type: 'reorder',
            lesson: lessonNum,
            auxiliaryLessons: auxLessons,
            targetId: grammarTargetId,
            prompt: example.translation.vi,
            context: 'Sắp xếp các cụm từ thành câu hoàn chỉnh',
            options: [...blocks].sort(() => Math.random() - 0.5),
            answer: blocks,
            explanationVi: example.translation.vi,
            explanationJp: example.jp,
          });
        }

        // 3.3 Listening (Nghe và chép chính tả câu)
        questions.push({
          id: `listening-${pad2(lessonNum)}-${point.id}-${exIdx}`,
          type: 'listening',
          lesson: lessonNum,
          auxiliaryLessons: auxLessons,
          targetId: grammarTargetId,
          prompt: example.jp,
          context: 'Nghe audio/phát âm và nhập lại câu chính xác',
          answer: stripFurigana(example.jp),
          acceptedVariants: [stripFurigana(example.jp)],
          explanationVi: example.translation.vi,
          explanationJp: example.jp,
        });
      });
    });
  }

  return questions;
};
