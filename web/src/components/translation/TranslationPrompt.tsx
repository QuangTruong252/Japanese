import { Furigana } from '@/components/Furigana';
import type { TranslationDirection } from '@/lib/translation';
import type { TranslationSentence } from '@/lib/translation-data';

export const CONFIG_HREF = '/luyen-tap/dich-cau';

export function TranslationPrompt({ sentence, direction }: { sentence: TranslationSentence; direction: TranslationDirection }) {
  return direction === 'jp-vi'
    ? <Furigana text={sentence.jp} className="jp-display text-3xl font-bold text-foreground sm:text-4xl" />
    : <p className="break-words font-serif text-2xl font-semibold text-foreground sm:text-3xl">{sentence.vi}</p>;
}
