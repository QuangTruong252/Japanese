'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TranslationRunner } from '@/components/translation/TranslationRunner';

function Session() {
  const params = useSearchParams();
  return <TranslationRunner id={params.get('id') ?? ''} />;
}

export default function TranslationSessionPage() {
  return <Suspense><Session /></Suspense>;
}
