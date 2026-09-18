'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Furigana } from '@/components/Furigana';
import { Sparkles } from 'lucide-react';

// Import 31 chữ Hán N5 thông dụng, tương ứng với 31 ngày trong tháng
import kanji01 from '@/data/n5/kanji/日.json';
import kanji02 from '@/data/n5/kanji/月.json';
import kanji03 from '@/data/n5/kanji/火.json';
import kanji04 from '@/data/n5/kanji/水.json';
import kanji05 from '@/data/n5/kanji/木.json';
import kanji06 from '@/data/n5/kanji/金.json';
import kanji07 from '@/data/n5/kanji/土.json';
import kanji08 from '@/data/n5/kanji/人.json';
import kanji09 from '@/data/n5/kanji/学.json';
import kanji10 from '@/data/n5/kanji/校.json';
import kanji11 from '@/data/n5/kanji/先.json';
import kanji12 from '@/data/n5/kanji/生.json';
import kanji13 from '@/data/n5/kanji/本.json';
import kanji14 from '@/data/n5/kanji/何.json';
import kanji15 from '@/data/n5/kanji/山.json';
import kanji16 from '@/data/n5/kanji/川.json';
import kanji17 from '@/data/n5/kanji/時.json';
import kanji18 from '@/data/n5/kanji/分.json';
import kanji19 from '@/data/n5/kanji/大.json';
import kanji20 from '@/data/n5/kanji/小.json';
import kanji21 from '@/data/n5/kanji/中.json';
import kanji22 from '@/data/n5/kanji/車.json';
import kanji23 from '@/data/n5/kanji/前.json';
import kanji24 from '@/data/n5/kanji/後.json';
import kanji25 from '@/data/n5/kanji/今.json';
import kanji26 from '@/data/n5/kanji/行.json';
import kanji27 from '@/data/n5/kanji/来.json';
import kanji28 from '@/data/n5/kanji/見.json';
import kanji29 from '@/data/n5/kanji/食.json';
import kanji30 from '@/data/n5/kanji/飲.json';
import kanji31 from '@/data/n5/kanji/話.json';

const DAILY_KANJI_LIST = [
  kanji01, kanji02, kanji03, kanji04, kanji05, kanji06, kanji07, kanji08, kanji09, kanji10,
  kanji11, kanji12, kanji13, kanji14, kanji15, kanji16, kanji17, kanji18, kanji19, kanji20,
  kanji21, kanji22, kanji23, kanji24, kanji25, kanji26, kanji27, kanji28, kanji29, kanji30,
  kanji31,
];

export function DailyKanji() {
  const kanji = useMemo(() => {
    const dayOfMonth = new Date().getDate(); // 1 đến 31
    const index = (dayOfMonth - 1) % DAILY_KANJI_LIST.length;
    return DAILY_KANJI_LIST[index] ?? kanji01;
  }, []);

  const viMeanings = kanji.meanings?.vi ?? [];
  const onyomi = kanji.onyomi ?? [];
  const kunyomi = kanji.kunyomi ?? [];
  const examples = (kanji.examples ?? []).slice(0, 2);

  return (
    <Card className="rounded-2xl border-border/80 bg-card shadow-sm overflow-hidden flex flex-col justify-between hover:border-primary/40 transition-colors">
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Header Widget */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="uppercase tracking-wider">Kanji hôm nay · N5</span>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-muted border border-border/60">
            {kanji.strokes} nét
          </span>
        </div>

        {/* Khối chữ Hán chính */}
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-center font-jp text-5xl font-bold text-primary shrink-0 shadow-inner select-none">
            {kanji.character}
          </div>
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="text-base font-bold text-foreground">
              {viMeanings.join(', ') || kanji.character}
            </div>
            {onyomi.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground/80">Âm On: </span>
                <span className="font-jp text-foreground">{onyomi.join(', ')}</span>
              </div>
            )}
            {kunyomi.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground/80">Âm Kun: </span>
                <span className="font-jp text-foreground">{kunyomi.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ví dụ từ ghép tiêu biểu */}
        {examples.length > 0 && (
          <div className="pt-2 border-t border-border/60 space-y-2">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Từ ghép tiêu biểu
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {examples.map((ex, idx) => (
                <div
                  key={idx}
                  className="flex flex-col p-2 rounded-xl bg-muted/40 border border-border/50 text-xs"
                >
                  <div className="font-medium">
                    <Furigana text={ex.word} className="text-sm font-semibold" />
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {ex.meaning?.vi ?? ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
