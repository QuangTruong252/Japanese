'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { Pause, Play, Repeat, RotateCcw, RotateCw } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Chip } from '@/components/PaperKit';
import { FeatureIcon } from '@/components/FeatureIcon';
import { Furigana } from '@/components/Furigana';
import { SpeakButton } from '@/components/SpeakButton';
import { formatOptionalBrackets, stripFurigana } from '@/lib/japanese';
import { DEFAULT_SETTINGS, getSettingsSnapshot, subscribeSettings } from '@/lib/settings';
import { db } from '@/lib/db';
import { shouldHandleShadowingKey } from '@/lib/shadowing-keys';
import { useUIStore } from '@/lib/store';
import {
  formatTime,
  normalizeLoopPoints,
} from '@/lib/shadowing';
import { cn } from '@/lib/utils';
import type { AudioFileRecord } from '@/types';

export interface ShadowingPlayerProps {
  lessonNum: number;
  examples?: Array<{
    jp: string;
    translation: { vi: string };
  }>;
}

const TRACK_ORDER: Array<{
  type: 'vocab' | 'sentence_patterns' | 'examples' | 'conversation';
  label: string;
}> = [
  { type: 'vocab', label: 'Từ vựng' },
  { type: 'sentence_patterns', label: 'Mẫu câu' },
  { type: 'examples', label: 'Câu ví dụ' },
  { type: 'conversation', label: 'Hội thoại' },
];

const SPEEDS = [0.75, 0.85, 1.0, 1.2];

export function ShadowingPlayer({ lessonNum, examples = [] }: ShadowingPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Đọc danh sách track của bài này từ IndexedDB
  const audioRecords = useLiveQuery(
    () => db.audioFiles.where('lesson').equals(lessonNum).toArray(),
    [lessonNum]
  );

  // Lấy các state từ Zustand store
  const {
    isPlaying,
    playbackRate,
    loopA,
    loopB,
    showTranscript,
    setIsPlaying,
    setPlaybackRate,
    setLoopA,
    setLoopB,
    setShowTranscript,
  } = useUIStore();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoopActive, setIsLoopActive] = useState(false);
  const [userSelectedType, setUserSelectedType] = useState<
    'vocab' | 'sentence_patterns' | 'examples' | 'conversation' | null
  >(null);

  // Bản đồ các track có sẵn trong bài
  const availableTracksMap = useMemo(() => {
    const map = new Map<string, AudioFileRecord>();
    if (audioRecords) {
      for (const rec of audioRecords) {
        map.set(rec.type, rec);
      }
    }
    return map;
  }, [audioRecords]);

  // Suy ra activeType trực tiếp trong render (tránh setState trong useEffect)
  const activeType = useMemo(() => {
    if (!audioRecords || audioRecords.length === 0) return null;
    if (userSelectedType && availableTracksMap.has(userSelectedType)) {
      return userSelectedType;
    }
    const preferred: Array<'conversation' | 'examples' | 'sentence_patterns' | 'vocab'> = [
      'conversation',
      'examples',
      'sentence_patterns',
      'vocab',
    ];
    return (
      preferred.find((t) => availableTracksMap.has(t)) ||
      (audioRecords[0]?.type as typeof userSelectedType) ||
      null
    );
  }, [audioRecords, availableTracksMap, userSelectedType]);

  const activeRecord = activeType ? availableTracksMap.get(activeType) : null;

  // Quản lý tạo và revoke Blob URL cho thẻ <audio>
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!activeRecord) {
      if (audio.hasAttribute('src')) {
        audio.removeAttribute('src');
        audio.load();
      }
      return;
    }

    const url = URL.createObjectURL(activeRecord.blob);
    audio.src = url;
    audio.load();

    return () => {
      URL.revokeObjectURL(url);
      audio.removeAttribute('src');
      audio.load();
    };
  }, [activeRecord]);

  // Chọn track khác
  const handleSelectTrack = useCallback(
    (type: 'vocab' | 'sentence_patterns' | 'examples' | 'conversation') => {
      setUserSelectedType(type);
      setCurrentTime(0);
      setLoopA(null);
      setLoopB(null);
      setIsLoopActive(false);
      setIsPlaying(false);
    },
    [setLoopA, setLoopB, setIsPlaying]
  );

  // Âm lượng theo cài đặt; activeRecord trong deps để áp lại khi thẻ audio vừa được dựng
  const { soundVolume } = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    () => DEFAULT_SETTINGS
  );
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = soundVolume;
    }
  }, [soundVolume, activeRecord]);

  // Cập nhật playbackRate cho thẻ audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Xử lý tua ±10s
  const handleSeekOffset = useCallback(
    (offset: number) => {
      if (audioRef.current && duration > 0) {
        const nextTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + offset));
        audioRef.current.currentTime = nextTime;
        setCurrentTime(nextTime);
      }
    },
    [duration]
  );

  // Play / Pause toggle
  const handleTogglePlay = useCallback(() => {
    if (!audioRef.current || !activeRecord) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch((err) => console.warn('Play error:', err));
    } else {
      audioRef.current.pause();
    }
  }, [activeRecord]);

  // Xử lý mốc lặp A và B
  const handleSetLoopA = useCallback(() => {
    if (!audioRef.current) return;
    const t = audioRef.current.currentTime;
    setLoopA(t);
  }, [setLoopA]);

  const handleSetLoopB = useCallback(() => {
    if (!audioRef.current) return;
    const t = audioRef.current.currentTime;
    setLoopB(t);
  }, [setLoopB]);

  const handleToggleLoop = useCallback(() => {
    if (loopA !== null && loopB !== null) {
      setIsLoopActive((prev) => !prev);
    } else if (loopA === null && loopB === null && duration > 0) {
      const cur = audioRef.current ? audioRef.current.currentTime : 0;
      setLoopA(cur);
      setLoopB(Math.min(duration, cur + 3));
      setIsLoopActive(true);
    }
  }, [loopA, loopB, duration, setLoopA, setLoopB]);

  // Chuẩn hóa mốc lặp A-B
  const loopPoints = useMemo(() => {
    return normalizeLoopPoints(loopA, loopB, duration);
  }, [loopA, loopB, duration]);

  // Sự kiện timeupdate của audio
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    setCurrentTime(cur);

    if (isLoopActive && loopPoints) {
      if (cur >= loopPoints.loopB) {
        audioRef.current.currentTime = loopPoints.loopA;
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
  };

  // Click vào thanh tiến trình để tua
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * duration;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  // Đăng ký phím tắt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!shouldHandleShadowingKey(e, activeRecord != null)) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handleTogglePlay();
          break;
        case '[':
          e.preventDefault();
          handleSetLoopA();
          break;
        case ']':
          e.preventDefault();
          handleSetLoopB();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          handleToggleLoop();
          break;
        case 't':
        case 'T':
          if (activeType === 'examples') {
            e.preventDefault();
            setShowTranscript(!showTranscript);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSeekOffset(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSeekOffset(10);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    handleTogglePlay,
    handleSetLoopA,
    handleSetLoopB,
    handleToggleLoop,
    handleSeekOffset,
    activeType,
    activeRecord,
    showTranscript,
    setShowTranscript,
  ]);

  // Khi đang tải dữ liệu audio từ Dexie
  if (audioRecords === undefined) {
    return <Skeleton className="h-[4.5rem] w-full rounded-xl" />;
  }

  // Khi chưa nạp bất kỳ track nào cho bài này
  if (audioRecords.length === 0) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground [&_svg]:size-7"
          aria-hidden="true"
        >
          <FeatureIcon name="listening" />
        </span>
        <p className="min-w-0 flex-1 basis-40 font-medium text-foreground">
          Chưa nạp audio cho bài này
        </p>
        <Link
          href="/cai-dat/audio"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'min-h-11 border-primary/40 text-primary'
          )}
        >
          Nạp audio đĩa CD
        </Link>
      </div>
    );
  }

  // Lấy các track có thật để hiển thị tab
  const availableTrackTypes = TRACK_ORDER.filter((t) => availableTracksMap.has(t.type));

  // Tỉ lệ % tiến độ
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const loopAPercent = duration > 0 && loopPoints ? (loopPoints.loopA / duration) * 100 : null;
  const loopBPercent = duration > 0 && loopPoints ? (loopPoints.loopB / duration) * 100 : null;

  return (
    <div className="space-y-6">
      {/* Audio element ẩn */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          if (isLoopActive && loopPoints && audioRef.current) {
            audioRef.current.currentTime = loopPoints.loopA;
            audioRef.current.play().catch(() => {});
          } else {
            setIsPlaying(false);
          }
        }}
        onError={() => {
          const audio = audioRef.current;
          if (!audio || !audio.currentSrc || !activeRecord) return;
          console.warn('Audio playback error on track:', activeRecord.type);
        }}
        className="hidden"
      />

      {/* 1. Hàng chọn Track */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {availableTrackTypes.map((tab) => (
          <Chip
            key={tab.type}
            pressed={activeType === tab.type}
            onClick={() => handleSelectTrack(tab.type)}
          >
            {tab.label}
          </Chip>
        ))}
      </div>

      {/* 2. Thẻ Trình phát Shadowing (Player Card) */}
      <div className="space-y-6 rounded-xl border border-border bg-card p-4 sm:p-5">
        {/* Scrubber Tiến trình */}
        <div className="space-y-1.5">
          <div
            ref={progressBarRef}
            onClick={handleProgressBarClick}
            className="relative h-7 flex items-center cursor-pointer select-none group"
            role="slider"
            aria-label="Thanh tiến trình audio"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(currentTime)}
            aria-valuetext={`${formatTime(currentTime)} trên ${formatTime(duration)}`}
          >
            {/* Rãnh nền */}
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden relative">
              {/* Dải vùng lặp A-B */}
              {isLoopActive && loopAPercent !== null && loopBPercent !== null && (
                <div
                  className="absolute top-0 bottom-0 bg-primary/25 rounded-full"
                  style={{
                    left: `${loopAPercent}%`,
                    width: `${Math.max(0, loopBPercent - loopAPercent)}%`,
                  }}
                />
              )}
              {/* Vạch tiến độ đã phát */}
              <div
                className="h-full w-full origin-left bg-primary transition-transform duration-75"
                style={{ transform: `scaleX(${progressPercent / 100})` }}
              />
            </div>

            {/* Mốc A (Pin) */}
            {loopAPercent !== null && (
              <div
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                style={{ left: `${loopAPercent}%` }}
              >
                <span className="text-xs font-bold text-primary leading-none bg-background px-1 py-0.5 rounded border border-primary/40 shadow-xs">
                  A
                </span>
                <span className="w-0.5 h-2 bg-primary mt-0.5" />
              </div>
            )}

            {/* Mốc B (Pin) */}
            {loopBPercent !== null && (
              <div
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                style={{ left: `${loopBPercent}%` }}
              >
                <span className="text-xs font-bold text-primary leading-none bg-background px-1 py-0.5 rounded border border-primary/40 shadow-xs">
                  B
                </span>
                <span className="w-0.5 h-2 bg-primary mt-0.5" />
              </div>
            )}

            {/* Con trỏ vị trí hiện tại */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-4 rounded-full bg-primary border-2 border-background shadow-xs pointer-events-none transition-transform group-hover:scale-125"
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          {/* Dòng thời gian */}
          <div className="flex justify-between text-xs font-mono text-muted-foreground tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Cụm Điều khiển Phát & Tua */}
        <div className="flex items-center justify-center gap-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleSeekOffset(-10)}
            aria-label="Lùi 10 giây"
            className="relative size-11 rounded-full text-foreground hover:bg-muted/80"
          >
            <RotateCcw className="size-5" aria-hidden="true" />
            <span className="absolute mt-0.5 text-xs font-bold">10</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
            className="size-11 rounded-full border-primary/40 bg-accent text-primary hover:bg-accent/70"
          >
            {isPlaying ? (
              <Pause className="size-5" aria-hidden="true" />
            ) : (
              <Play className="ml-0.5 size-5" aria-hidden="true" />
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleSeekOffset(10)}
            aria-label="Tiến 10 giây"
            className="relative size-11 rounded-full text-foreground hover:bg-muted/80"
          >
            <RotateCw className="size-5" aria-hidden="true" />
            <span className="absolute mt-0.5 text-xs font-bold">10</span>
          </Button>
        </div>

        {/* Tốc độ phát */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {SPEEDS.map((s) => (
            <Chip
              key={s}
              pressed={playbackRate === s}
              onClick={() => setPlaybackRate(s)}
              className="tabular-nums"
            >
              {s.toFixed(2).replace(/\.00$/, '.0')}×
            </Chip>
          ))}
        </div>

        {/* Lặp A-B */}
        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-border pt-4">
          <Chip pressed={loopA !== null} onClick={handleSetLoopA}>
            Đặt A
          </Chip>
          <Chip pressed={loopB !== null} onClick={handleSetLoopB}>
            Đặt B
          </Chip>
          <Chip
            pressed={isLoopActive}
            onClick={handleToggleLoop}
            disabled={loopPoints === null && duration === 0}
            icon={<Repeat aria-hidden="true" />}
          >
            Lặp
          </Chip>
        </div>
      </div>

      {/* 3. Khối Câu ví dụ tham khảo */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-base font-semibold text-foreground">
              Câu ví dụ tham khảo
            </h3>
            <p className="text-xs text-muted-foreground">
              Không phải bản chép lời của track. Chưa đối chiếu với nội dung track.
            </p>
          </div>
          {examples.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {showTranscript ? 'Thu gọn' : 'Xem câu'}
            </Button>
          )}
        </div>

        {showTranscript && examples.length > 0 && (
          <div className="space-y-2">
            {examples.map((ex, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="jp font-jp text-base font-medium text-foreground">
                    <Furigana text={ex.jp} />
                  </div>
                  <p className="translation text-sm text-muted-foreground">{ex.translation.vi}</p>
                </div>
                <SpeakButton
                  text={stripFurigana(formatOptionalBrackets(ex.jp))}
                  label={stripFurigana(formatOptionalBrackets(ex.jp))}
                  className="size-11 w-11 shrink-0 rounded-full border border-border bg-secondary text-primary hover:bg-accent"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
