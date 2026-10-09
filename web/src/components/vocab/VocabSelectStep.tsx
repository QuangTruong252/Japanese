'use client';

import { Check, CheckCheck, CircleHelp } from 'lucide-react';
import { Furigana } from '@/components/Furigana';
import { Chip, PageTitle, SectionHeader } from '@/components/PaperKit';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatOptionalBrackets, stripFurigana } from '@/lib/japanese';
import { cn } from '@/lib/utils';
import type { ReviewItem } from '@/types';
import { formatDate, getAccuracy, type VocabEntry } from './vocab-shared';

interface VocabDraftSummary {
  currentIndex: number;
  targetIds: string[];
}

interface Preset {
  label: string;
  ids: Set<string>;
}

function sameSet(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every((id) => b.has(id));
}

export function VocabSelectStep({
  lessonNumber,
  lessonTitle,
  entries,
  availableCount,
  selectedIds,
  selectedCount,
  presets,
  loading,
  draft,
  onApplyPreset,
  onToggle,
  onResumeDraft,
  onDiscardDraft,
}: {
  lessonNumber: number;
  lessonTitle: string;
  entries: VocabEntry[];
  availableCount: number;
  selectedIds: Set<string>;
  selectedCount: number;
  presets: Preset[];
  loading: boolean;
  draft: VocabDraftSummary | null;
  onApplyPreset: (ids: Set<string>) => void;
  onToggle: (targetId: string) => void;
  onResumeDraft: () => void;
  onDiscardDraft: () => void;
}) {
  return (
    <div className="w-full min-w-0 space-y-8 py-4">
      <PageTitle title={`Học từ vựng bài ${lessonNumber}`} meta={lessonTitle} />

      {draft && !loading && (
        <section
          aria-label="Lượt học đang dở"
          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm">
            Bạn đang học dở: thẻ {draft.currentIndex + 1} / {draft.targetIds.length}.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button type="button" variant="outline" size="quiz" className="px-4 text-sm" onClick={onResumeDraft}>
              Học tiếp
            </Button>
            <Button type="button" variant="ghost" size="quiz" className="px-4 text-sm" onClick={onDiscardDraft}>
              Bỏ lượt dở
            </Button>
          </div>
        </section>
      )}

      <section aria-labelledby="vocab-selection-title" className="space-y-3">
        <div>
          <SectionHeader id="vocab-selection-title" title="Chọn từ muốn học" />
          <p className="-mt-2 text-sm text-muted-foreground">
            Đã chọn {selectedCount} / {availableCount} từ
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn nhanh số từ">
          {presets.map(({ label, ids }) => (
            <Chip key={label} pressed={sameSet(selectedIds, ids)} onClick={() => onApplyPreset(ids)}>
              {label}
            </Chip>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2" aria-label="Đang tải tiến độ từ vựng">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : (
          <ul className="space-y-2">
            {entries.map(({ targetId, word, reviewItem }) => {
              const hasMeaning = Boolean(word.meaning.vi.trim());
              const selected = selectedIds.has(targetId);
              const attempts = reviewItem ? reviewItem.correctCount + reviewItem.incorrectCount : 0;
              const progressText = reviewItem
                ? `${getAccuracy(reviewItem)}% nhớ đúng · ${reviewItem.incorrectCount} lần quên`
                : 'Chưa có lượt luyện hoặc ôn';
              return (
                <li key={targetId}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    disabled={!hasMeaning}
                    aria-label={`${selected ? 'Bỏ chọn' : 'Chọn'} ${formatOptionalBrackets(stripFurigana(word.word))}`}
                    onClick={() => onToggle(targetId)}
                    className={cn(
                      'flex min-h-[76px] w-full items-center gap-4 rounded-xl border bg-card px-4 py-3 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                      selected ? 'border-primary/40 bg-accent/40' : 'border-border',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-lg border-2',
                        selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/50 bg-card',
                      )}
                    >
                      {selected && <Check className="size-5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="jp jp-vocab block text-lg font-medium">
                        <Furigana text={word.word} />
                        {word.verbForms && (
                          <span className="ml-2 text-sm font-normal text-muted-foreground">
                            (Masu: {formatOptionalBrackets(stripFurigana(word.verbForms.masu))})
                          </span>
                        )}
                      </span>
                      {!hasMeaning && <span className="block text-sm text-muted-foreground">Chưa có bản dịch tiếng Việt</span>}
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {attempts > 0 ? `${progressText} · ôn ${formatDate(reviewItem!.dueAt)}` : progressText}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="memory-title">
        <SectionHeader id="memory-title" title="Theo dõi khả năng ghi nhớ" />
        <MemoryRankings entries={entries} />
      </section>
    </div>
  );
}

function MemoryRankings({ entries }: { entries: VocabEntry[] }) {
  const reviewed = entries.flatMap((entry) => {
    const item = entry.reviewItem;
    if (!item || item.correctCount + item.incorrectCount === 0) return [];
    return [{ ...entry, reviewItem: item, accuracy: getAccuracy(item) }];
  });

  const mostStable = [...reviewed]
    .filter(({ reviewItem }) => reviewItem.correctCount > 0)
    .sort(
      (a, b) =>
        b.accuracy - a.accuracy ||
        b.reviewItem.fsrsCard.stability - a.reviewItem.fsrsCard.stability,
    )
    .slice(0, 5);
  const needsPractice = [...reviewed]
    .filter(({ reviewItem }) => reviewItem.incorrectCount > 0)
    .sort(
      (a, b) =>
        (b.reviewItem.incorrectCount / (b.reviewItem.correctCount + b.reviewItem.incorrectCount)) -
          (a.reviewItem.incorrectCount / (a.reviewItem.correctCount + a.reviewItem.incorrectCount)) ||
        b.reviewItem.incorrectCount - a.reviewItem.incorrectCount ||
        a.reviewItem.fsrsCard.stability - b.reviewItem.fsrsCard.stability,
    )
    .slice(0, 5);

  if (reviewed.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Chưa có lượt luyện hoặc ôn. Kết quả sẽ hiện ở đây sau khi bạn học từ đầu tiên.
      </p>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <MemoryList
        title="Nhớ ổn định"
        icon={CheckCheck}
        entries={mostStable}
        emptyText="Chưa có từ nào được nhớ đúng."
        value={(item) => `${item.accuracy}% nhớ đúng · ôn ${formatDate(item.reviewItem.dueAt)}`}
      />
      <MemoryList
        title="Cần củng cố"
        icon={CircleHelp}
        entries={needsPractice}
        emptyText="Chưa ghi nhận lần quên nào."
        value={(item) => `${item.reviewItem.incorrectCount} lần quên · ${item.accuracy}% nhớ đúng`}
      />
    </div>
  );
}

type RankedEntry = VocabEntry & { reviewItem: ReviewItem; accuracy: number };

function MemoryList({
  title,
  icon: Icon,
  entries,
  emptyText,
  value,
}: {
  title: string;
  icon: typeof Check;
  entries: RankedEntry[];
  emptyText: string;
  value: (entry: RankedEntry) => string;
}) {
  return (
    <section className="space-y-3" aria-label={title}>
      <h3 className="flex items-center gap-2 font-semibold">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        {title}
      </h3>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ol className="divide-y divide-border border-y border-border">
          {entries.map((entry) => (
            <li key={entry.targetId} className="flex min-w-0 items-center justify-between gap-3 py-3">
              <div className="jp jp-vocab min-w-0 font-medium">
                <Furigana text={entry.word.word} />
              </div>
              <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {value(entry)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
