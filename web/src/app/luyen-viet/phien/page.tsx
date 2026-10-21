import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SessionSkeleton } from '@/components/practice/SessionFrame';
import { WritingSession } from './WritingSession';

export const metadata: Metadata = {
  title: 'Phiên luyện viết · MaiPace',
};

export default function WritingSessionPage() {
  return (
    <Suspense fallback={<SessionSkeleton />}>
      <WritingSession />
    </Suspense>
  );
}
