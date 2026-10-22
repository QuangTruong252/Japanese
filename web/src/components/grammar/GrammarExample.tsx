import { Furigana } from '@/components/Furigana';
import { SpeakButton } from '@/components/SpeakButton';
import { SPEAK_CLASS } from '@/components/dialogue/reader-styles';
import { markSegments } from '@/lib/grammar';
import { formatOptionalBrackets, stripFurigana } from '@/lib/japanese';
import { cn } from '@/lib/utils';
import type { ExampleSentence } from '@/types';

/** Câu ví dụ có mark: phần cố định đậm đỏ, phần ô gạch chân màu ô. `lead` = ví dụ đầu, cỡ hiển thị lớn. */
export function GrammarExample({
  example,
  slots,
  lead,
}: {
  example: ExampleSentence;
  slots?: string[];
  lead?: boolean;
}) {
  const speakText = stripFurigana(formatOptionalBrackets(example.jp));
  return (
    <div className="flex items-start gap-3 py-4">
      <div className="min-w-0 flex-1">
        <Furigana
          text={example.jp}
          marks={markSegments(example.jp, example.marks, slots)}
          className={cn(lead ? 'jp-display text-2xl font-bold sm:text-3xl' : 'jp-example font-medium')}
        />
        <p className={cn('translation text-muted-foreground', lead ? 'mt-1' : 'text-sm')}>
          {example.translation.vi}
        </p>
      </div>
      <SpeakButton text={speakText} label={speakText} className={SPEAK_CLASS} />
    </div>
  );
}
