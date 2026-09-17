export interface DistractorCandidate {
  kana: string;
  type: string;
  stripped: string;
}

const KANA = /[ぁ-んァ-ヴー]/;

export const okuriganaTail = (stripped: string): string => {
  let index = stripped.length;
  while (index > 0 && KANA.test(stripped[index - 1]!)) index -= 1;
  return stripped.slice(index);
};

const SAME_TYPE = 3;
const SAME_TAIL = 3;

const lengthScore = (candidate: number, answer: number) => {
  const difference = Math.abs(candidate - answer);
  if (difference === 0) return 2;
  if (difference === 1) return 1;
  return 0;
};

export const pickDistractors = (
  answer: DistractorCandidate,
  pool: readonly DistractorCandidate[],
  count: number,
  random: () => number = Math.random
): string[] => {
  const answerTail = okuriganaTail(answer.stripped);

  const unique = new Map<string, DistractorCandidate>();
  pool.forEach((candidate) => {
    if (candidate.kana !== answer.kana) unique.set(candidate.kana, candidate);
  });

  return [...unique.values()]
    .map((candidate) => ({
      kana: candidate.kana,
      score:
        (candidate.type === answer.type ? SAME_TYPE : 0) +
        (okuriganaTail(candidate.stripped) === answerTail ? SAME_TAIL : 0) +
        lengthScore(candidate.kana.length, answer.kana.length) +
        random(),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ kana }) => kana);
};
