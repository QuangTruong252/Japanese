'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  FileArchive,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  RotateCw,
  Volume2,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Furigana } from '@/components/Furigana';
import { SpeakButton } from '@/components/SpeakButton';
import { stripFurigana } from '@/lib/japanese';
import { db } from '@/lib/db';
import { useUIStore } from '@/lib/store';
import {
  formatTime,
  isTypingTarget,
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

  // Quản lý tạo và revoke Blob URL cho thẻ <audio> (SPEC-10 §2.1)
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

  // Đăng ký phím tắt (SPEC-10 §6)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

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
    showTranscript,
    setShowTranscript,
  ]);

  // Khi đang tải dữ liệu audio từ Dexie (SPEC-10)
  if (audioRecords === undefined) {
    return (
      <div className="h-28 rounded-2xl border border-border/60 bg-card/40 animate-pulse flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Đang kiểm tra audio…</span>
      </div>
    );
  }

  // Khi chưa nạp bất kỳ track nào cho bài này (SPEC-10 §5)
  if (audioRecords.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed border-border/80 bg-card/60 p-6 text-center space-y-3">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Volume2 className="size-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">
            Chưa nạp audio cho bài này
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Bạn có thể nạp gói ZIP audio từ đĩa CD Minna no Nihongo mà bạn sở hữu trong mục Cài đặt để luyện nghe và Shadowing trên máy này.
          </p>
        </div>
        <div className="pt-1">
          <Link
            href="/cai-dat/audio"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'gap-1.5 text-xs'
            )}
          >
            <FileArchive className="size-3.5" />
            <span>Nạp audio đĩa CD</span>
          </Link>
        </div>
      </Card>
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

      {/* 1. Hàng chọn Track (Tabs) */}
      <div className="flex border-b border-border/80 overflow-x-auto">
        {availableTrackTypes.map((tab) => {
          const isActive = activeType === tab.type;
          return (
            <button
              key={tab.type}
              type="button"
              onClick={() => handleSelectTrack(tab.type)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative cursor-pointer',
                isActive
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Thẻ Trình phát Shadowing (Player Card) */}
      <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-6">
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
                className="h-full bg-primary transition-[width] duration-75"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Mốc A (Pin) */}
            {loopAPercent !== null && (
              <div
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                style={{ left: `${loopAPercent}%` }}
              >
                <span className="text-[10px] font-bold text-primary leading-none bg-background px-1 py-0.5 rounded border border-primary/40 shadow-xs">
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
                <span className="text-[10px] font-bold text-primary leading-none bg-background px-1 py-0.5 rounded border border-primary/40 shadow-xs">
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
            className="size-11 rounded-full text-foreground hover:bg-muted/80 relative"
          >
            <RotateCcw className="size-5" />
            <span className="text-[10px] font-bold absolute mt-0.5">10</span>
          </Button>

          <Button
            type="button"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
            className="size-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 flex items-center justify-center"
          >
            {isPlaying ? <Pause className="size-7" /> : <Play className="size-7 ml-0.5" />}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleSeekOffset(10)}
            aria-label="Tiến 10 giây"
            className="size-11 rounded-full text-foreground hover:bg-muted/80 relative"
          >
            <RotateCw className="size-5" />
            <span className="text-[10px] font-bold absolute mt-0.5">10</span>
          </Button>
        </div>

        {/* Tốc độ phát (Speed Chips) */}
        <div className="flex items-center justify-center gap-2">
          {SPEEDS.map((s) => {
            const isSelected = playbackRate === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setPlaybackRate(s)}
                className={cn(
                  'h-8 px-3 rounded-full text-xs font-semibold tabular-nums transition-colors cursor-pointer',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                )}
              >
                {s.toFixed(2).replace(/\.00$/, '.0')}×
              </button>
            );
          })}
        </div>

        {/* Các nút Chức năng Lặp A-B & Transcript */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSetLoopA}
            className="h-10 gap-1.5 font-medium text-xs border-border/80"
          >
            <span className="size-4 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
              A
            </span>
            <span>Đặt A</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSetLoopB}
            className="h-10 gap-1.5 font-medium text-xs border-border/80"
          >
            <span className="size-4 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
              B
            </span>
            <span>Đặt B</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToggleLoop}
            aria-pressed={isLoopActive}
            disabled={loopPoints === null && duration === 0}
            className={cn(
              'h-10 gap-1.5 font-medium text-xs border-border/80 transition-colors',
              isLoopActive && 'border-primary bg-primary/10 text-primary font-semibold'
            )}
          >
            <Repeat className="size-4" />
            <span>Lặp</span>
          </Button>
        </div>
      </Card>

      {/* 3. Khối Câu ví dụ tham khảo (SPEC-10 §2.4) */}
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
              <Card
                key={idx}
                className="rounded-xl border border-border/70 bg-card/60 p-4 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="jp font-jp text-base font-medium text-foreground">
                      <Furigana text={ex.jp} />
                    </div>
                    <p className="translation text-xs sm:text-sm text-muted-foreground">
                      {ex.translation.vi}
                    </p>
                  </div>
                  <SpeakButton
                    text={stripFurigana(ex.jp)}
                    label={stripFurigana(ex.jp)}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
