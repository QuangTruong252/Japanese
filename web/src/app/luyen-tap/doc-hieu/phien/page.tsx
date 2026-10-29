'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ReadingRunner } from '@/components/reading/ReadingRunner';

function Session() {
  const params = useSearchParams();
  return <ReadingRunner id={params.get('id') ?? ''} />;
}

export default function ReadingSessionPage() {
  return <Suspense><Session /></Suspense>;
}
