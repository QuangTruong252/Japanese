import type { Metadata } from 'next';
import { getAllKanji, getKanjiLesson } from '@/lib/lookup';
import { WritingPicker, type KanjiGroup } from './WritingPicker';

export const metadata: Metadata = {
  title: 'Luyện viết · MaiPace',
};

// Tính ở server: getKanjiLesson cần chỉ mục từ vựng 25 bài, không được đi theo vào bundle client.
function buildKanjiGroups(): KanjiGroup[] {
  const byLesson = new Map<number | undefined, KanjiGroup['cells']>();
  for (const k of getAllKanji()) {
    const lesson = getKanjiLesson(k);
    byLesson.set(lesson, [...(byLesson.get(lesson) ?? []), { char: k.character, hanviet: k.hanviet ?? '' }]);
  }
  const lessons = [...byLesson.keys()].filter((l): l is number => l !== undefined).sort((a, b) => a - b);
  const groups = lessons.map((l) => ({ id: `bai-${l}`, title: `Bài ${l}`, cells: byLesson.get(l)! }));
  const rest = byLesson.get(undefined);
  return rest ? [...groups, { id: 'khac', title: 'Kanji N5 khác', cells: rest }] : groups;
}

export default function WritingPage() {
  return <WritingPicker kanjiGroups={buildKanjiGroups()} />;
}
