import type { ReadingAnchor, ReadingPassage } from '../types/reading.ts';
import { computeReadingCoverage } from './reading-data.ts';
import { formatOptionalBrackets, stripFurigana } from './japanese.ts';
import { loadLesson, loadVocab } from './lessons.ts';

/** `lesson:wordId` của toàn bộ từ vựng N5, để kiểm `ref`/`vocabRef`. */
export async function allVocabIds(): Promise<Set<string>> {
  const lists = await Promise.all(Array.from({ length: 25 }, (_, i) => loadVocab(i + 1)));
  return new Set(lists.flatMap((words, i) => words.map((word) => `${i + 1}:${word.id}`)));
}

const anchorOf = (sentenceId: string, jp: string, text: string): ReadingAnchor => {
  const normalized = formatOptionalBrackets(stripFurigana(jp));
  const start = normalized.indexOf(text);
  if (start < 0) throw new Error(`fixture: không có "${text}" trong câu ${sentenceId}`);
  return { sentenceId, start, end: start + text.length, text };
};

/**
 * Bài hội thoại tối thiểu từ nguyên văn `l10-heya` (bài 10): câu Nhật và bản dịch lấy từ dữ liệu bài học,
 * chỉ câu hỏi, giải thích và glossary là nội dung soạn cho kiểm thử.
 */
export async function makeDialogueFixture(): Promise<ReadingPassage> {
  const lesson = await loadLesson(10);
  const dialogue = lesson.dialogues!.find((d) => d.id === 'l10-heya')!;
  const sentences = dialogue.lines.map((line, i) => ({ id: `${dialogue.id}-${i + 1}`, jp: line.jp, vi: line.translation.vi, speaker: line.speaker }));
  const first = sentences[0]!;
  const passage: ReadingPassage = {
    id: 'fixture-l10-heya',
    kind: 'dialogue',
    titleVi: 'Tìm điện thoại',
    roles: dialogue.roles,
    illustration: dialogue.illustration,
    vocabUsed: [
      { id: '10:arimasu', ref: '10:arimasu', lesson: 10, glossaryId: 'g-arimasu' },
    ],
    grammarUsed: [{ id: '10:wa-ni-arimasu', glossaryId: 'g-wa-ni' }],
    coverage: { version: 2, vocab: { totalTypes: 0, byLesson: {}, unknownTypes: 0 }, grammar: { totalTypes: 0, byLesson: {}, unknownTypes: 0 } },
    glossary: [
      { id: 'g-arimasu', kind: 'word', ref: '10:arimasu', labelJp: 'ある', reading: 'ある', meaningsVi: ['ở, có (đồ vật)'], vocabRef: { lesson: 10, wordId: 'arimasu' }, anchors: [anchorOf(first.id, first.jp, 'あります')] },
      { id: 'g-tanaka', kind: 'name', labelJp: '田中', reading: 'たなか', meaningsVi: ['Tanaka (tên người)'], anchors: [anchorOf(first.id, first.jp, '田中')] },
      { id: 'g-wa-ni', kind: 'grammar', labelJp: 'N は N に あります', meaningsVi: ['N1 ở N2'], anchors: [anchorOf(first.id, first.jp, 'どこに あります')] },
    ],
    sentences,
    questions: [
      { id: 'q1', promptVi: 'Mai đang tìm gì?', options: [{ id: 'a', textVi: 'Điện thoại' }, { id: 'b', textVi: 'Chìa khóa' }, { id: 'c', textVi: 'Cuốn sách' }], correctOptionId: 'a', explanationVi: 'Mai hỏi điện thoại của em ở đâu.', evidenceSentenceIds: [`${dialogue.id}-1`] },
      { id: 'q2', promptVi: 'Có phải ở trên bàn không?', options: [{ id: 'a', textVi: 'Có' }, { id: 'b', textVi: 'Không' }, { id: 'c', textVi: 'Không rõ' }], correctOptionId: 'b', explanationVi: 'Mai đáp rằng không có.', evidenceSentenceIds: [`${dialogue.id}-3`] },
      { id: 'q3', promptVi: 'Cuối cùng điện thoại ở đâu?', options: [{ id: 'a', textVi: 'Trên bàn' }, { id: 'b', textVi: 'Trong túi' }, { id: 'c', textVi: 'Dưới ghế' }], correctOptionId: 'b', explanationVi: 'Câu cuối nói điện thoại ở trong túi.', evidenceSentenceIds: [`${dialogue.id}-4`, `${dialogue.id}-5`] },
    ],
    source: { kind: 'minna-dialogue', lesson: 10, dialogueId: dialogue.id },
    review: {
      method: 'ai-multilayer',
      layers: [
        { layer: 1, status: 'passed' },
        { layer: 2, status: 'not-applicable', note: 'Nguồn có sẵn' },
        { layer: 3, status: 'passed' },
        { layer: 4, status: 'passed' },
        { layer: 5, status: 'not-applicable', note: 'Nguồn có sẵn' },
      ],
      models: ['fixture'],
      date: '2026-10-29',
      nativeReviewed: false,
    },
  };
  passage.coverage = computeReadingCoverage(passage);
  return passage;
}
