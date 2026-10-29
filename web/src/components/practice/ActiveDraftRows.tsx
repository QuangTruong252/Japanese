'use client';

import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ListRow, TornCard } from '@/components/PaperKit';
import { buttonVariants } from '@/components/ui/button';
import { useActiveDrafts } from '@/lib/active-drafts';
import { clearNewSessionRequest } from '@/lib/practice-draft';
import { db } from '@/lib/db';

function FeaturedDraft({ href, onClick, title, detail }: { href: string; onClick?: () => void; title: string; detail: string }) {
  return (
    <TornCard className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <h2 className="font-serif text-xl font-semibold text-foreground sm:text-2xl">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
      </div>
      <Link href={href} onClick={onClick} className={buttonVariants({ size: 'quiz' })} aria-label={title}>
        Tiếp tục <ArrowRight aria-hidden="true" />
      </Link>
    </TornCard>
  );
}

export function ActiveDraftRows({ includeVocab = false, featured = false }: { includeVocab?: boolean; featured?: boolean }) {
  const { practiceDraft, vocabDraft } = useActiveDrafts();
  const dictation = useLiveQuery(
    async () => {
      try {
        const draft = await db.dictationSessions.orderBy('updatedAt').reverse().filter((s) => !s.completedAt && s.index < s.sentences.length).first();
        return { draft, error: false };
      } catch {
        return { draft: undefined, error: true };
      }
    },
    [],
  );

  return (
    <div className="flex flex-col gap-2 empty:hidden">
      {practiceDraft && (featured ? (
        <FeaturedDraft
          href={practiceDraft.resumeHref}
          onClick={clearNewSessionRequest}
          title={practiceDraft.label === 'Ôn tập' ? 'Tiếp tục ôn tập' : 'Tiếp tục bài tập'}
          detail={`Câu ${practiceDraft.currentQuestionIndex}/${practiceDraft.totalQuestions}`}
        />
      ) : (
        <ListRow
          href={practiceDraft.resumeHref}
          onClick={clearNewSessionRequest}
          icon={<Clock />}
          title="Phiên đang dở"
          detail={`${practiceDraft.label === 'Ôn tập' ? 'Ôn tập' : 'Bài tập'} · Câu ${practiceDraft.currentQuestionIndex}/${practiceDraft.totalQuestions}`}
        />
      ))}
      {dictation?.error && <p role="alert" className="text-sm text-destructive">Không đọc được nháp nghe. Hãy tải lại trang.</p>}
      {dictation?.draft && (featured && !practiceDraft ? (
        <FeaturedDraft
          href={`/nghe-moi-ngay/phien?id=${encodeURIComponent(dictation.draft.id)}`}
          title="Tiếp tục nghe"
          detail={`Bài 1–${dictation.draft.scope} · Câu ${dictation.draft.index + 1}/${dictation.draft.sentences.length}`}
        />
      ) : (
        <ListRow
          href={`/nghe-moi-ngay/phien?id=${encodeURIComponent(dictation.draft.id)}`}
          icon={<Clock />}
          title="Nghe đang dở"
          detail={`Bài 1–${dictation.draft.scope} · Câu ${dictation.draft.index + 1}/${dictation.draft.sentences.length}`}
        />
      ))}
      {includeVocab && vocabDraft && (
        <ListRow
          href={vocabDraft.resumeHref}
          icon={<Clock />}
          title={`Học từ vựng Bài ${vocabDraft.lesson}`}
          detail={`Từ ${vocabDraft.currentWordIndex}/${vocabDraft.totalWords}`}
        />
      )}
    </div>
  );
}
