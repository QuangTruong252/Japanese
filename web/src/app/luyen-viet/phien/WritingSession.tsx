'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, Check, Eraser, Eye, Pencil, RotateCw, X } from 'lucide-react';
import { Illustration } from '@/components/Illustration';
import { StrokeStep } from '@/components/lookup/StrokeSteps';
import { TornCard } from '@/components/PaperKit';
import { SpeakButton } from '@/components/SpeakButton';
import {
  PauseLayer,
  SessionHeader,
  SessionNotice,
  SessionShell,
  SessionSkeleton,
} from '@/components/practice/SessionFrame';
import { Button, buttonVariants } from '@/components/ui/button';
import { StrokeBox, type StrokeBoxHandle, type StrokeBoxMode } from '@/components/writing/StrokeBox';
import { db } from '@/lib/db';
import { Rating } from '@/lib/fsrs';
import { REVIEW_COMPLETE_ART } from '@/lib/illustrations';
import { getStrokes, hasStrokes } from '@/lib/strokes';
import { speak } from '@/lib/tts';
import { cn } from '@/lib/utils';
import {
  buildWritingSession,
  dueChars,
  hardChars,
  rateWriting,
  recordWriting,
  type WritingResult,
  type WritingStep,
} from '@/lib/writing';
import { kanaInfo, parseWritingChars, type KanjiWritingInfo } from '@/lib/writing-ui';

type KanjiInfoMap = Record<string, KanjiWritingInfo>;

const LEARN_MODES: StrokeBoxMode[] = ['watch', 'trace', 'guided'];
const STEP_LABELS = ['Xem', 'Tô', 'Gợi ý', 'Tự viết'];
// Để người học kịp thấy chữ đủ nét trước khi tự sang bước kế.
const AUTO_ADVANCE_MS = 600;

type Init =
  | { kind: 'loading' }
  | { kind: 'ready'; steps: WritingStep[] }
  | { kind: 'empty'; message: string }
  | { kind: 'error' };

interface WrittenChar {
  char: string;
  result: WritingResult;
}

/** Kết quả một lượt Tự viết: icon + chữ, màu không tự mang nghĩa. */
function ResultLine({ result, className }: { result: WritingResult; className?: string }) {
  const grade = rateWriting(result);
  const [tone, label, mark] =
    grade === Rating.Good
      ? ['bg-success/15 text-success', 'Đúng', <Check key="m" className="size-5 stroke-[2.5]" aria-hidden="true" />]
      : grade === Rating.Hard
        ? [
            'bg-warning/15 text-warning',
            `${result.misses} lỗi`,
            <span key="m" className="text-lg font-bold leading-none" aria-hidden="true">
              !
            </span>,
          ]
        : [
            'bg-destructive/15 text-destructive',
            'Đã xem gợi ý',
            <X key="m" className="size-5 stroke-[2.5]" aria-hidden="true" />,
          ];
  const textTone = tone.split(' ')[1];
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', tone)}>{mark}</span>
      <span className={cn('text-lg font-semibold', textTone)}>{label}</span>
    </div>
  );
}

function StepLine({ current }: { current: number }) {
  return (
    <ol aria-label="Các bước" className="flex flex-wrap items-center justify-center gap-x-2 text-sm">
      {STEP_LABELS.map((label, i) => (
        <li key={label} aria-current={i === current ? 'step' : undefined} className="flex items-center gap-2">
          {i > 0 && (
            <span aria-hidden="true" className="text-muted-foreground/60">
              ·
            </span>
          )}
          <span className={i === current ? 'font-bold text-primary' : 'text-muted-foreground'}>{label}</span>
        </li>
      ))}
    </ol>
  );
}

/** Các nét của chữ, mỗi ô thêm một nét (nét vừa thêm màu đỏ). Chỉ dùng ở bước học, nơi chữ đã hiện. */
function StrokeOrder({ strokes }: { strokes: string[] }) {
  return (
    <ol aria-label="Thứ tự nét" className="grid grid-cols-2 gap-2">
      {strokes.map((_, i) => (
        <li key={i} className="flex items-center gap-2">
          <span className="w-4 shrink-0 text-center text-sm tabular-nums text-muted-foreground">{i + 1}</span>
          <StrokeStep
            strokes={strokes}
            step={i}
            strokeWidth={5}
            className="aspect-square min-w-0 flex-1 rounded-lg border border-border bg-card"
          />
        </li>
      ))}
    </ol>
  );
}

/** Đề kanji: âm Hán Việt, nghĩa, On/Kun và từ ví dụ với chữ cần viết thay bằng ô trống. Không có chữ đáp án. */
function KanjiPrompt({ info, className }: { info: KanjiWritingInfo; className?: string }) {
  const readings = [
    info.on.length > 0 && `On ${info.on.join('・')}`,
    info.kun.length > 0 && `Kun ${info.kun.join('・')}`,
  ]
    .filter(Boolean)
    .join(' · ');
  const { example } = info;
  return (
    <div className={cn('flex w-full max-w-sm flex-col items-center gap-1 text-center', className)}>
      <p className="font-serif text-4xl font-bold leading-tight text-foreground">{info.hanviet}</p>
      <p className="font-serif text-xl font-semibold leading-snug text-foreground">{info.meaning}</p>
      {readings && (
        <p lang="ja" className="jp text-sm text-muted-foreground">
          {readings}
        </p>
      )}
      {example && (
        <p className="mt-2 flex flex-wrap items-baseline justify-center gap-x-2 rounded-2xl border border-border bg-card px-4 py-2">
          <span lang="ja" className="jp text-xl font-semibold text-foreground">
            {[...example.blanked].map((c, i) =>
              c === '＿' ? (
                <span key={i} className="border-b-2 border-primary">
                  {c}
                </span>
              ) : (
                c
              ),
            )}
          </span>
          <span lang="ja" className="jp text-sm text-muted-foreground">
            {example.reading}
          </span>
          <span className="text-sm text-muted-foreground">— {example.meaning}</span>
        </p>
      )}
    </div>
  );
}

function SessionDone({ records, kanjiInfo }: { records: WrittenChar[]; kanjiInfo: KanjiInfoMap }) {
  const router = useRouter();
  return (
    <SessionShell>
      <div className="flex h-16 shrink-0 items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 rounded-full border border-border bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => router.push('/luyen-viet')}
          aria-label="Thoát phiên"
        >
          <X className="size-5" aria-hidden="true" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-2">
        <Illustration
          asset={REVIEW_COMPLETE_ART}
          sizes="(min-width: 640px) 224px, 192px"
          className="mx-auto size-48 object-contain sm:size-56"
        />
        <h1 className="text-center font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          Xong {records.length} chữ
        </h1>
        <ul className="space-y-2">
          {records.map(({ char, result }) => (
            <li key={char} className="flex items-center gap-4 rounded-xl border border-border bg-card p-3">
              <div className="flex w-16 shrink-0 flex-col items-center">
                <span className="jp text-3xl font-bold leading-none text-foreground" lang="ja">
                  {char}
                </span>
                <span className="mt-1 text-sm text-muted-foreground">
                  {kanjiInfo[char]?.hanviet ?? kanaInfo(char)?.romaji}
                </span>
              </div>
              <span aria-hidden="true" className="h-10 w-px shrink-0 bg-border" />
              <ResultLine result={result} />
            </li>
          ))}
        </ul>
      </div>
      <div className="shrink-0 pb-4 pt-2">
        <Link href="/luyen-viet" className={cn(buttonVariants({ size: 'quiz' }), 'w-full font-semibold')}>
          Về Luyện viết
        </Link>
      </div>
    </SessionShell>
  );
}

function WritingRunner({ steps, kanjiInfo }: { steps: WritingStep[]; kanjiInfo: KanjiInfoMap }) {
  const router = useRouter();
  const [turn, setTurn] = useState(0);
  // Bước con trong lượt học: 0 Xem, 1 Tô, 2 Gợi ý. Lượt Tự viết luôn là 0.
  const [sub, setSub] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [stepDone, setStepDone] = useState(false);
  // Kết quả lần viết đầu của lượt Tự viết: là lần duy nhất được chấm vào lịch.
  const [first, setFirst] = useState<WritingResult | null>(null);
  const [save, setSave] = useState<'saving' | 'saved' | 'error'>('saving');
  const [records, setRecords] = useState<WrittenChar[]>([]);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const boxRef = useRef<StrokeBoxHandle>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const step = steps[turn] as WritingStep | undefined;
  const char = step?.char;
  const phase = step?.phase;

  const goTo = useCallback((nextTurn: number, nextSub = 0) => {
    setTurn(nextTurn);
    setSub(nextSub);
    setAttempt(0);
    setStepDone(false);
    setFirst(null);
    setSave('saving');
  }, []);

  // Đồng hồ chỉ chạy khi không tạm dừng và phiên chưa xong.
  useEffect(() => {
    if (paused || turn >= steps.length) return;
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [paused, turn, steps.length]);

  // Bước học xong thì tự sang bước kế; lượt học xong thì sang lượt sau.
  useEffect(() => {
    if (!stepDone || paused || phase !== 'learn') return;
    const timer = setTimeout(() => {
      if (sub < LEARN_MODES.length - 1) goTo(turn, sub + 1);
      else goTo(turn + 1);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [stepDone, paused, phase, sub, turn, goTo]);

  // Vào bước Tự viết: chỉ đọc chữ, không tự focus nút nào — Enter nhầm vào "Xem đáp án" sẽ lộ đáp án và bị tính Again.
  useEffect(() => {
    if (phase !== 'recall' || !char || kanjiInfo[char]) return;
    speak(char);
  }, [phase, char, turn, kanjiInfo]);
  useEffect(() => {
    if (save === 'saved') nextRef.current?.focus();
  }, [save]);

  const persist = useCallback(async (target: string, result: WritingResult) => {
    setSave('saving');
    try {
      await recordWriting(target, result);
      setRecords((prev) => [...prev, { char: target, result }]);
      setSave('saved');
    } catch {
      setSave('error');
    }
  }, []);

  if (!step || !char) return <SessionDone records={records} kanjiInfo={kanjiInfo} />;

  const strokes = getStrokes(char);
  const kanji = kanjiInfo[char];
  // Kanji không có "cách đọc" để gọi tên chữ, nên nhãn ô dùng âm Hán Việt thay vì chữ (đề không được lộ chữ).
  const boxLabel = kanji ? `Ô viết chữ Hán ${kanji.hanviet}` : `Ô viết chữ ${kanaInfo(char)?.romaji ?? char}`;
  const romaji = kanaInfo(char)?.romaji ?? char;
  // Kanji có thêm khối đề nên ô hẹp lại (320px) để cả màn 390×844 vừa không cuộn.
  const colWidth = cn(kanji ? 'max-w-80' : 'max-w-sm', 'md:max-w-[35rem] lg:max-w-[28rem]');
  const isRecall = step.phase === 'recall';
  const mode: StrokeBoxMode = isRecall ? 'recall' : LEARN_MODES[sub];

  const onComplete = (result: WritingResult) => {
    // Bước học bị dừng thì đã sang lượt mới. Ở Tự viết, nét hoàn tất muộn (đã chạm trước lúc dừng) vẫn là bài viết
    // thật: phải nhận, vì StrokeBox chỉ báo xong một lần — bỏ đi thì lượt kẹt không còn nút Tiếp.
    if (paused && !isRecall) return;
    if (!isRecall) {
      setStepDone(true);
      return;
    }
    // "Viết lại" là luyện thêm: chỉ lần đầu của chữ được ghi vào lịch.
    if (first) return;
    setFirst(result);
    void persist(char, result);
  };

  // Bước học dừng giữa chừng thì làm lại từ đầu (lượt mới, hủy hẹn tự chuyển); bước Tự viết giữ nét đang viết,
  // `inert` ở vùng nội dung lo việc chặn thao tác.
  const pause = () => {
    if (!isRecall) {
      setStepDone(false);
      setAttempt((n) => n + 1);
    }
    setPaused(true);
  };

  const stepFraction = isRecall ? (first ? 1 : 0) : sub / LEARN_MODES.length;

  const pillClass = 'min-h-11 flex-1 gap-1.5 rounded-full px-2';

  return (
    <SessionShell className="md:max-w-3xl lg:max-w-5xl">
      <SessionHeader
        regionLabel="Phiên luyện viết"
        exitLabel="Thoát phiên"
        onExit={() => router.push('/luyen-viet')}
        index={turn}
        total={steps.length}
        progress={(turn + stepFraction) / steps.length}
        duration={elapsed}
        isPaused={paused}
        pauseLabel={paused ? 'Tiếp tục' : 'Tạm dừng'}
        onTogglePause={() => (paused ? setPaused(false) : pause())}
      />

      <div className="relative min-h-0 flex-1">
        <div inert={paused} className="flex h-full flex-col items-center gap-4 overflow-y-auto pb-4 pt-2">
          <StepLine current={isRecall ? 3 : sub} />

          <div className="flex w-full flex-col items-center gap-4 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)_14rem] lg:items-start lg:gap-8">
            <div className="hidden lg:block">
              <TornCard className="flex flex-col items-center gap-4 text-center">
                {kanji ? (
                  <KanjiPrompt info={kanji} />
                ) : (
                  <>
                    <p className="text-6xl font-bold text-foreground">{romaji}</p>
                    <SpeakButton
                      text={char}
                      label={romaji}
                      className="size-14 w-14 rounded-full border border-border bg-secondary text-primary hover:bg-accent"
                    />
                  </>
                )}
                <p className="w-full border-t border-border pt-3 text-lg text-muted-foreground">
                  {strokes?.d.length ?? 0} nét
                </p>
              </TornCard>
            </div>
            <div className="flex w-full min-w-0 flex-col items-center gap-4">
              {kanji ? (
                <KanjiPrompt info={kanji} className="lg:hidden" />
              ) : (
                <div className="flex items-center gap-4 lg:hidden">
                  <p className="text-5xl font-bold text-foreground">{romaji}</p>
                  <SpeakButton
                    text={char}
                    label={romaji}
                    className="size-11 w-11 rounded-full border border-border bg-secondary text-primary hover:bg-accent"
                  />
                </div>
              )}

              {strokes && (
                <StrokeBox
                  key={`${turn}-${sub}-${attempt}`}
                  ref={boxRef}
                  strokes={strokes.d}
                  numbers={strokes.n}
                  mode={mode}
                  label={boxLabel}
                  onComplete={onComplete}
                  className={colWidth}
                />
              )}

              {!isRecall && (
                <div className={cn('flex w-full gap-2', colWidth)}>
                  <Button
                    type="button"
                    variant="outline"
                    className={pillClass}
                    onClick={() => {
                      if (mode === 'watch') {
                        // Phát lại bằng ô mới để hoạt ảnh xong lại báo hoàn tất và tự sang bước kế.
                        setStepDone(false);
                        setAttempt((n) => n + 1);
                      } else boxRef.current?.replay();
                    }}
                  >
                    <RotateCw aria-hidden="true" />
                    Xem lại
                  </Button>
                  {mode !== 'watch' && (
                    <Button
                      type="button"
                      variant="outline"
                      className={pillClass}
                      onClick={() => {
                        // Ô mới thay vì clear(): clear() giữ cờ "đã xong" nên không báo hoàn tất lần nữa, và timer tự chuyển
                        // đã hẹn phải bị hủy (stepDone=false dọn effect).
                        setStepDone(false);
                        setAttempt((n) => n + 1);
                      }}
                    >
                      <Eraser aria-hidden="true" />
                      Xóa nét
                    </Button>
                  )}
                  <Button type="button" variant="outline" className={pillClass} onClick={() => goTo(turn + 1)}>
                    <Pencil aria-hidden="true" />
                    Tự viết
                  </Button>
                </div>
              )}

              {isRecall && !first && (
                <div className={cn('flex w-full gap-2', colWidth)}>
                  <Button type="button" variant="outline" className={pillClass} onClick={() => boxRef.current?.clear()}>
                    <Eraser aria-hidden="true" />
                    Xóa nét
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={pillClass}
                    onClick={() => boxRef.current?.reveal()}
                  >
                    <Eye aria-hidden="true" />
                    Xem đáp án
                  </Button>
                </div>
              )}

              {isRecall && first && (
                <div className={cn('flex w-full flex-col items-center gap-2', colWidth)} aria-live="polite">
                  <ResultLine result={first} />
                  {save === 'error' && (
                    <div role="alert" className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                      Chưa lưu được kết quả.
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11 rounded-full px-3"
                        onClick={() => void persist(char, first)}
                      >
                        Thử lại
                      </Button>
                    </div>
                  )}
                  <Button
                    ref={nextRef}
                    size="quiz"
                    className="w-full font-semibold"
                    disabled={save !== 'saved'}
                    onClick={() => goTo(turn + 1)}
                  >
                    Tiếp
                    <ArrowRight aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 px-4 text-muted-foreground"
                    onClick={() => setAttempt((n) => n + 1)}
                  >
                    Viết lại
                  </Button>
                </div>
              )}
            </div>
            {!isRecall && strokes && (
              <div className="hidden lg:block">
                <TornCard className="max-h-[calc(100dvh-16rem)] space-y-3 overflow-y-auto">
                  <h2 className="font-serif text-lg font-semibold text-foreground">Thứ tự nét</h2>
                  <StrokeOrder strokes={strokes.d} />
                </TornCard>
              </div>
            )}
          </div>
        </div>
        {paused && <PauseLayer title="Tạm dừng" resumeLabel="Tiếp tục" onResume={() => setPaused(false)} />}
      </div>
    </SessionShell>
  );
}

/**
 * Tham số URL và thẻ đã có được chụp một lần lúc mở: thẻ đổi giữa phiên (vừa ghi lịch)
 * không được làm dựng lại hàng lượt hay biến chữ mới thành chữ cũ.
 */
export function WritingSession({ kanjiInfo }: { kanjiInfo: KanjiInfoMap }) {
  const search = useSearchParams();
  const [params] = useState(() => ({
    c: search.get('c'),
    mode: search.get('mode'),
  }));
  const [init, setInit] = useState<Init>({ kind: 'loading' });

  useEffect(() => {
    let alive = true;
    (async () => {
      const cards = await db.writingCards.toArray();
      const now = new Date();
      let chars: string[];
      let emptyMessage = 'Không có chữ hợp lệ để viết.';
      if (params.mode === 'den-han') {
        chars = dueChars(cards, now);
        emptyMessage = 'Chưa có chữ nào đến hạn.';
      } else if (params.mode === 'kho') {
        chars = hardChars(cards);
        emptyMessage = 'Chưa có chữ khó.';
      } else {
        chars = parseWritingChars(params.c);
      }
      chars = chars.filter(hasStrokes);
      const next: Init =
        chars.length === 0
          ? { kind: 'empty', message: emptyMessage }
          : {
              kind: 'ready',
              steps: buildWritingSession(chars, new Set(cards.map((card) => card.char))),
            };
      if (alive) setInit(next);
    })().catch(() => {
      if (alive) setInit({ kind: 'error' });
    });
    return () => {
      alive = false;
    };
  }, [params]);

  if (init.kind === 'loading') return <SessionSkeleton />;
  if (init.kind === 'ready') return <WritingRunner steps={init.steps} kanjiInfo={kanjiInfo} />;
  return (
    <SessionNotice message={init.kind === 'empty' ? init.message : 'Không đọc được dữ liệu luyện viết.'}>
      <Link href="/luyen-viet" className={cn(buttonVariants({ size: 'quiz' }), 'w-full font-semibold')}>
        Về Luyện viết
      </Link>
    </SessionNotice>
  );
}
