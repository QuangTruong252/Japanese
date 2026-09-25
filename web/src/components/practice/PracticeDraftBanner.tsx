'use client';

import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  clearNewSessionRequest,
  clearPracticeDraft,
  getPracticeDraftSnapshot,
  subscribePracticeDraft,
} from '@/lib/practice-draft';

export default function PracticeDraftBanner() {
  const router = useRouter();

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const draft = useSyncExternalStore(
    subscribePracticeDraft,
    getPracticeDraftSnapshot,
    () => null,
  );

  if (!mounted || !draft || draft.currentIndex >= draft.questions.length) {
    return null;
  }

  const handleResume = () => {
    clearNewSessionRequest();
    router.push('/luyen-tap/phien');
  };

  const handleDiscard = () => {
    clearPracticeDraft();
  };

  return (
    <div
      role="region"
      aria-label="Phiên học dở"
      className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-accent/40 p-4 sm:flex-row sm:items-center sm:justify-between motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BookOpen className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Bạn còn phiên dở: câu {draft.currentIndex + 1}/{draft.questions.length}
          </p>
          <p className="text-xs text-muted-foreground">
            Tiếp tục bài làm hoặc xóa bỏ để bắt đầu mới
          </p>
        </div>
      </div>

      <div className="flex w-full items-center gap-2 sm:w-auto">
        <Button
          type="button"
          size="quiz"
          className="flex-1 sm:flex-initial"
          onClick={handleResume}
        >
          Học tiếp
        </Button>
        <Button
          type="button"
          variant="outline"
          size="quiz"
          className="flex-1 text-muted-foreground hover:text-foreground sm:flex-initial"
          onClick={handleDiscard}
        >
          <Trash2 className="mr-1.5 size-4" />
          Bỏ
        </Button>
      </div>
    </div>
  );
}
