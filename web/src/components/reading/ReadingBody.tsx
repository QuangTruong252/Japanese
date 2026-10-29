'use client';

import { Furigana } from '@/components/Furigana';
import { RoleAvatar } from '@/components/dialogue/RoleAvatar';
import { SpeakButton } from '@/components/SpeakButton';
import { SPEAK_CLASS } from '@/components/dialogue/reader-styles';
import { formatOptionalBrackets, stripFurigana } from '@/lib/japanese';
import type { ReadingDisplay } from '@/lib/reading-display';
import { cn } from '@/lib/utils';
import type { ReadingPassage, ReadingSentence } from '@/types/reading';
import { jpTextClass } from './display';
import { groupSentences } from './reading-text';
import { ReadingText } from './ReadingText';

export const sentenceDomId = (id: string) => `reading-sentence-${id}`;
export const readingSpeakText = (jp: string) => stripFurigana(formatOptionalBrackets(jp));

export interface ReadingBodyProps {
  passage: ReadingPassage;
  display: ReadingDisplay;
  showVi: boolean;
  lookup?: boolean;
  /** Câu bằng chứng (màn kết quả): viền, nền và nhãn chữ, không chỉ màu. */
  evidenceIds?: readonly string[];
  activeEntryId?: string | null;
  /** Bỏ trống thì chỉ hiển thị, không bấm tra từ. */
  onPick?: (entryIds: string[], element: HTMLElement) => void;
}

function Sentence({ sentence, passage, display, lookup, activeEntryId, onPick }: Pick<ReadingBodyProps, 'passage' | 'display' | 'lookup' | 'activeEntryId' | 'onPick'> & { sentence: ReadingSentence }) {
  return (
    <ReadingText
      sentenceId={sentence.id}
      jp={sentence.jp}
      glossary={passage.glossary}
      className={jpTextClass(display)}
      lookup={lookup}
      activeEntryId={activeEntryId}
      onPick={onPick}
    />
  );
}

const EvidenceLabel = () => (
  <span className="mb-1 inline-block rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">Bằng chứng</span>
);

/** Hội thoại: avatar + tên vai, bong bóng kiểu chat. Vai đầu tô sakura, vai khác nền thẻ. */
export function DialogueView(props: ReadingBodyProps) {
  const { passage, showVi, evidenceIds = [] } = props;
  const roles = passage.roles ?? [];
  return (
    <ol className="flex flex-col gap-4">
      {passage.sentences.map((sentence) => {
        const index = Math.max(0, roles.findIndex((r) => r.id === sentence.speaker));
        const role = roles[index] ?? { id: sentence.speaker ?? '', name: '' };
        const evidence = evidenceIds.includes(sentence.id);
        return (
          <li key={sentence.id} id={sentenceDomId(sentence.id)} className="grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-x-3 md:grid-cols-[3.5rem_minmax(0,1fr)]">
            <RoleAvatar role={role} size={48} className="mt-5" />
            <div className="min-w-0">
              <Furigana text={role.name} className="text-sm font-medium text-muted-foreground" />
              <div
                className={cn(
                  'rounded-2xl rounded-tl-md border px-4 py-2 md:px-6 md:py-3',
                  index === 0 ? 'border-transparent bg-accent' : 'border-border bg-card',
                  evidence && 'border-2 border-primary',
                )}
              >
                {evidence && <EvidenceLabel />}
                <div><Sentence sentence={sentence} {...props} /></div>
                <div className="flex min-w-0 items-center gap-2">
                  {showVi ? <p className="translation min-w-0 flex-1 text-sm leading-relaxed text-muted-foreground md:text-base">{sentence.vi}</p> : <span className="flex-1" />}
                  <SpeakButton text={readingSpeakText(sentence.jp)} label={readingSpeakText(sentence.jp)} className={SPEAK_CLASS} />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Đoạn văn: mỗi nhóm câu một hàng đánh số, bản dịch dưới hàng, vạch ngăn giữa các hàng. */
export function PassageView(props: ReadingBodyProps) {
  const { passage, showVi, evidenceIds = [] } = props;
  return (
    <ol className="divide-y divide-border rounded-2xl border border-border px-3 sm:px-5">
      {groupSentences(passage.sentences).map((row, i) => {
        const evidence = row.some((s) => evidenceIds.includes(s.id));
        return (
          <li key={row[0]!.id} id={sentenceDomId(row[0]!.id)} className={cn('grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 py-4', evidence && 'my-2 rounded-xl border-2 border-primary bg-accent px-2')}>
            <span aria-hidden="true" className="mt-3 flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-medium text-muted-foreground">{i + 1}</span>
            <div className="min-w-0">
              {evidence && <EvidenceLabel />}
              <p>
                {row.map((sentence, j) => (
                  <span key={sentence.id} id={j === 0 ? undefined : sentenceDomId(sentence.id)} className="mr-[0.5em] inline">
                    <Sentence sentence={sentence} {...props} />
                  </span>
                ))}
              </p>
              {showVi && <p className="translation text-sm leading-relaxed text-muted-foreground md:text-base">{row.map((s) => s.vi).join(' ')}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function ReadingBody(props: ReadingBodyProps) {
  return props.passage.kind === 'dialogue' ? <DialogueView {...props} /> : <PassageView {...props} />;
}
