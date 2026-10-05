'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { IllustrationAsset } from '@/types';

export function Illustration({
  asset,
  sizes,
  className,
  eager = false,
}: {
  asset: IllustrationAsset;
  sizes: string;
  className?: string;
  eager?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (failedSrc === asset.src) return null;

  return (
    <Image
      src={asset.src}
      width={asset.width}
      height={asset.height}
      alt={asset.alt.vi}
      sizes={sizes}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      onError={() => setFailedSrc(asset.src)}
    />
  );
}
