'use client';

import React from 'react';
import { groupFuriganaWords } from '@/lib/japanese';
import { groupMarkedWords, slotColor, type MarkedPiece, type MarkSegment } from '@/lib/grammar';

interface FuriganaProps {
  text: string;
  className?: string;
  zoomable?: boolean;
  /** Các đoạn từ `markSegments(text, …)`: phần cố định đậm đỏ, phần ô gạch chân màu ô. */
  marks?: MarkSegment[];
  /** Cách tô phần ô: gạch chân (câu ví dụ), viên thuốc nền nhạt (tiêu đề mẫu) hoặc gạch chân mảnh dưới chữ mực (mục lục). */
  markStyle?: 'underline' | 'pill' | 'index';
}

/**
 * Furigana bằng thẻ <ruby>/<rt> gốc. Mỗi cụm giữa hai dấu cách của dữ liệu là một khối
 * không ngắt dòng; khoảng cách giữa cụm thay cho dấu cách.
 */
export function Furigana({ text, className = '', zoomable = true, marks, markStyle = 'underline' }: FuriganaProps) {
  const words: MarkedPiece[][] = marks
    ? groupMarkedWords(marks)
    : groupFuriganaWords(text).map((word) => word.map((piece) => ({ ...piece, kind: 'plain' as const, segment: 0 })));

  const renderPiece = (segment: MarkedPiece, index: number) => {
    // Gạch chân đặt trên chữ gốc, không trên <ruby>, để furigana không bị gạch theo.
    const base = markedBase(segment, markStyle);
    if (!segment.ruby) {
      return <span key={index}>{base}</span>;
    }

    const rubyContent = (
      <ruby className="ruby-align-center">
        {base}
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
  };

  return (
    <span className={`jp inline-flex max-w-full flex-wrap items-baseline gap-x-[0.3em] ${className}`}>
      {words.map((word, w) => (
        <span key={w} className="inline-block max-w-full break-words [overflow-wrap:anywhere]">
          {marks
            ? // Mỗi đoạn mark là một khối liền: cụm dài tràn dòng thì chỉ xuống dòng ở ranh giới đoạn, và chỉ
              // một đoạn rộng hơn cả dòng mới bị cắt giữa chừng (nhờ overflow-wrap kế thừa).
              splitBySegment(word).map((group) => (
                <span key={group[0]!.segment} className="inline-block max-w-full">
                  {group.map(renderPiece)}
                </span>
              ))
            : word.map(renderPiece)}
        </span>
      ))}
    </span>
  );
}

// Dấu câu không được đứng đầu dòng: dính vào khối trước dù thuộc đoạn khác.
const LEADING_PUNCTUATION = /^[。、，．！？!?」』）)…ー〜]+/;

function splitBySegment(word: MarkedPiece[]): MarkedPiece[][] {
  const groups: MarkedPiece[][] = [];
  for (const piece of word) {
    const last = groups[groups.length - 1];
    if (last && last[0]!.segment === piece.segment) {
      last.push(piece);
      continue;
    }
    const punct = last && !piece.ruby ? LEADING_PUNCTUATION.exec(piece.base)?.[0] : undefined;
    if (punct) {
      last!.push({ ...piece, base: punct });
      const rest = piece.base.slice(punct.length);
      if (rest) groups.push([{ ...piece, base: rest }]);
    } else {
      groups.push([piece]);
    }
  }
  return groups;
}

function markedBase(
  { base, kind, slotIndex }: MarkedPiece,
  style: 'underline' | 'pill' | 'index',
) {
  if (kind === 'fixed') return <span className="font-bold text-primary">{base}</span>;
  if (kind !== 'slot' || slotIndex === undefined) return base;
  const color = slotColor(slotIndex);
  if (style === 'index') {
    // Chữ mực giữ tương phản trên card và nền sakura; màu ô chỉ nằm ở nét gạch chân.
    return (
      <span className="underline decoration-2 [text-underline-offset:0.12em]" style={{ textDecorationColor: color }}>
        {base}
      </span>
    );
  }
  if (style === 'pill') {
    // Chữ màu ô trên nền nhạt cùng màu chỉ đạt 3:1 với vài ô ở bản sáng, nên giữ chữ mực và để nền mang màu.
    return (
      <span
        className="rounded-lg px-2 py-0.5"
        style={{ background: `color-mix(in srgb, ${color} 22%, var(--background))` }}
      >
        {base}
      </span>
    );
  }
  return (
    <span className="underline decoration-[3px] [text-underline-offset:0.22em]" style={{ textDecorationColor: color }}>
      {base}
    </span>
  );
}
