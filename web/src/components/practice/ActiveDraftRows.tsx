'use client';

import { Clock } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ListRow } from '@/components/PaperKit';
import { useActiveDrafts } from '@/lib/active-drafts';
import { clearNewSessionRequest } from '@/lib/practice-draft';
import { db } from '@/lib/db';

export function ActiveDraftRows({ includeVocab = false }: { includeVocab?: boolean }) {
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
      {practiceDraft && (
        <ListRow
          href={practiceDraft.resumeHref}
          onClick={clearNewSessionRequest}
          icon={<Clock />}
          title="Phiên đang dở"
          detail={`${practiceDraft.label === 'Ôn tập' ? 'Ôn tập' : 'Bài tập'} · Câu ${practiceDraft.currentQuestionIndex}/${practiceDraft.totalQuestions}`}
        />
      )}
      {dictation?.error && <p role="alert" className="text-sm text-destructive">Không đọc được nháp nghe. Hãy tải lại trang.</p>}
      {dictation?.draft && (
        <ListRow
          href={`/nghe-moi-ngay/phien?id=${encodeURIComponent(dictation.draft.id)}`}
          icon={<Clock />}
          title="Nghe đang dở"
          detail={`Bài 1–${dictation.draft.scope} · Câu ${dictation.draft.index + 1}/${dictation.draft.sentences.length}`}
        />
      )}
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
