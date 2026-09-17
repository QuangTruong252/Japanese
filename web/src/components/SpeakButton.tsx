'use client';

import { useEffect, useState } from 'react';
import { Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hasJapaneseVoice, speak } from '@/lib/tts';

/**
 * Nút phát âm. `text` là chuỗi ĐỌC ĐƯỢC (kana hoặc đã stripFurigana), không phải notation thô.
 * Không có giọng ja-JP thì ẩn hẳn nút (SPEC-03 §5) — nút chết tệ hơn không có nút.
 */
export function SpeakButton({ text, label }: { text: string; label: string }) {
  const [hasVoice, setHasVoice] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    let alive = true;
    hasJapaneseVoice().then((ok) => {
      if (alive) setHasVoice(ok);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!hasVoice) return null;

  const handleClick = () => {
    const utterance = speak(text);
    if (!utterance) return;
    setSpeaking(true);
    const done = () => setSpeaking(false);
    utterance.addEventListener('end', done);
    utterance.addEventListener('error', done);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="quiz"
      className="w-12 px-0"
      aria-label={`Phát âm ${label}`}
      onClick={handleClick}
    >
      {speaking ? <Loader2 className="motion-safe:animate-spin" /> : <Volume2 />}
    </Button>
  );
}
