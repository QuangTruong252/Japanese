'use client';

import React from 'react';
import { groupFuriganaWords } from '@/lib/japanese';

interface FuriganaProps {
  text: string;
  className?: string;
  zoomable?: boolean;
}

/**
 * Furigana bằng thẻ <ruby>/<rt> gốc. Mỗi cụm giữa hai dấu cách của dữ liệu là một khối
 * không ngắt dòng; khoảng cách giữa cụm thay cho dấu cách (spec v3 §2.3).
 */
export function Furigana({ text, className = '', zoomable = true }: FuriganaProps) {
  const words = groupFuriganaWords(text);

  return (
    <span className={`jp inline-flex flex-wrap items-baseline gap-x-[0.3em] ${className}`}>
      {words.map((word, w) => (
        <span key={w} className="whitespace-nowrap">
          {word.map((segment, index) => {
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
      ))}
    </span>
  );
}
