'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DictationRunner } from '@/components/dictation/DictationRunner';

function Session() {
  const params = useSearchParams();
  return <DictationRunner id={params.get('id') ?? ''} />;
}

export default function DictationSessionPage() {
  return <Suspense><Session /></Suspense>;
}
