import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SessionSkeleton } from '@/components/practice/SessionFrame';
import { getAllKanji, isExampleVerified } from '@/lib/lookup';
import { kanjiWritingInfo } from '@/lib/writing-ui';
import { WritingSession } from './WritingSession';

export const metadata: Metadata = {
  title: 'Phiên luyện viết · MaiPace',
};

// Dựng ở server để bundle client không kéo theo lookup.ts và từ vựng 25 bài.
const KANJI_INFO = Object.fromEntries(
  getAllKanji().map((k) => [k.character, kanjiWritingInfo(k, isExampleVerified)]),
);

export default function WritingSessionPage() {
  return (
    <Suspense fallback={<SessionSkeleton />}>
      <WritingSession kanjiInfo={KANJI_INFO} />
    </Suspense>
  );
}
