'use client';

import React from 'react';
import { parseFurigana } from '@/lib/japanese';

interface FuriganaProps {
  text: string;
  className?: string;
  zoomable?: boolean;
}

/**
 * Hiển thị Furigana chuẩn thẻ <ruby> và <rt> gốc theo mục 7.2 của spec
 */
export function Furigana({ text, className = '', zoomable = true }: FuriganaProps) {
  const segments = parseFurigana(text);

  return (
    <span className={`jp inline-flex flex-wrap items-baseline ${className}`}>
      {segments.map((segment, index) => {
        if (!segment.ruby) {
          return <span key={index}>{segment.base}</span>;
        }

        const rubyContent = (
          <ruby className="ruby-align-center">
            {segment.base}
            <rt className="select-none font-medium">{segment.ruby}</rt>
          </ruby>
        );

        if (zoomable) {
          return (
            <span key={index} className="ruby-word">
              {rubyContent}
            </span>
          );
        }

        return <React.Fragment key={index}>{rubyContent}</React.Fragment>;
      })}
    </span>
  );
}
