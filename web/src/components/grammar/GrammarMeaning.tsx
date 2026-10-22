import { Furigana } from '@/components/Furigana';
import { grammarMeaning } from '@/lib/grammar';

/** Nghĩa ngắn của điểm; vài tiêu đề kể chữ Nhật nên có furigana thì đi qua `Furigana`. */
export function GrammarMeaning({ title }: { title: string }) {
  const meaning = grammarMeaning(title);
  return meaning.includes('[') ? <Furigana text={meaning} /> : meaning;
}
