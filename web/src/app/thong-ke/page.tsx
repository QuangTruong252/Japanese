'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useDueClock } from '@/lib/use-due-clock';
import {
  currentStreak,
  minutesOnDay,
  accuracyOverDays,
  dailyMinutes,
  dailyAccuracy,
  targetsByType,
  activityHeatmap,
  type HeatmapDay,
  type DayValue,
} from '@/lib/stats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  Flame,
  Clock,
  CheckCircle2,
  Layers,
  ArrowRight,
  ChevronDown,
  BarChart3,
  Dumbbell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TargetType } from '@/types';

// Cấu hình loại mục tiêu cố định theo SPEC-07 §4 & design-system §11.3
const TARGET_TYPE_CONFIG: Record<
  TargetType,
  { label: string; colorClass: string; bgClass: string; borderClass: string }
> = {
  vocab: {
    label: 'Từ vựng',
    colorClass: 'text-[hsl(var(--chart-1))]',
    bgClass: 'bg-[hsl(var(--chart-1))]',
    borderClass: 'border-[hsl(var(--chart-1))]',
  },
  grammar: {
    label: 'Ngữ pháp',
    colorClass: 'text-[hsl(var(--chart-2))]',
    bgClass: 'bg-[hsl(var(--chart-2))]',
    borderClass: 'border-[hsl(var(--chart-2))]',
  },
  kanji: {
    label: 'Hán tự',
    colorClass: 'text-[hsl(var(--chart-3))]',
    bgClass: 'bg-[hsl(var(--chart-3))]',
    borderClass: 'border-[hsl(var(--chart-3))]',
  },
  particle: {
    label: 'Trợ từ',
    colorClass: 'text-[hsl(var(--chart-4))]',
    bgClass: 'bg-[hsl(var(--chart-4))]',
    borderClass: 'border-[hsl(var(--chart-4))]',
  },
  listening: {
    label: 'Luyện nghe',
    colorClass: 'text-[hsl(var(--chart-5))]',
    bgClass: 'bg-[hsl(var(--chart-5))]',
    borderClass: 'border-[hsl(var(--chart-5))]',
  },
};

const TARGET_KEYS: TargetType[] = ['vocab', 'grammar', 'kanji', 'particle', 'listening'];

export default function ThongKePage() {
  const now = useDueClock();

  // 1. Đọc dữ liệu từ IndexedDB (Dexie) qua useLiveQuery
  const sessions = useLiveQuery(() => db.practiceSessions.orderBy('createdAt').toArray());
  const reviewItems = useLiveQuery(() => db.reviewItems.toArray());

  // Trạng thái mở chi tiết bảng số liệu
  const [showHeatmapTable, setShowHeatmapTable] = useState(false);
  const [showMinutesTable, setShowMinutesTable] = useState(false);
  const [showAccuracyTable, setShowAccuracyTable] = useState(false);

  // 2. Tính toán các chỉ số thống kê thuần túy
  const streak = useMemo(
    () => (sessions ? currentStreak(sessions, now) : { days: 0, truncated: false }),
    [sessions, now],
  );

  const todayMinutes = useMemo(
    () => (sessions ? minutesOnDay(sessions, now) : 0),
    [sessions, now],
  );

  const accuracy7d = useMemo(
    () => (sessions ? accuracyOverDays(sessions, 7, now) : null),
    [sessions, now],
  );

  const totalReviews = reviewItems?.length ?? 0;

  // Lịch nhiệt 12 tuần
  const heatmapWeeks = useMemo(
    () => (sessions ? activityHeatmap(sessions, 12, now) : []),
    [sessions, now],
  );

  // Phút học 14 ngày
  const minutes14d = useMemo(
    () => (sessions ? dailyMinutes(sessions, 14, now) : []),
    [sessions, now],
  );

  // Tỷ lệ đúng 30 ngày
  const accuracy30d = useMemo(
    () => (sessions ? dailyAccuracy(sessions, 30, now) : []),
    [sessions, now],
  );

  // Phân bố mục tiêu theo loại
  const targetCounts = useMemo(
    () => (reviewItems ? targetsByType(reviewItems) : null),
    [reviewItems],
  );

  // Kiểm tra hôm nay đã học chưa (để hiện gợi ý giữ chuỗi)
  const hasStudiedToday = todayMinutes > 0;

  // 3. Xử lý trạng thái đang tải (Skeleton)
  if (sessions === undefined || reviewItems === undefined) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-8 pb-32 sm:pb-16 animate-pulse">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>

        {/* 4 ô KPI Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-3 w-32" />
            </Card>
          ))}
        </div>

        <Card className="p-6 h-64">
          <Skeleton className="h-full w-full" />
        </Card>
        <Card className="p-6 h-64">
          <Skeleton className="h-full w-full" />
        </Card>
      </main>
    );
  }

  // 4. Trạng thái rỗng: chưa có phiên học nào
  if (sessions.length === 0) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-8 pb-32 sm:pb-16">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Thống kê
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tổng quan tiến độ học tập và phân tích kết quả rèn luyện.
          </p>
        </div>

        <Card className="border-dashed py-14 px-6 text-center">
          <CardContent className="max-w-md mx-auto space-y-4 p-0">
            <div className="size-14 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <BarChart3 className="size-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold text-foreground">
                Chưa có dữ liệu thống kê
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Làm một phiên luyện tập là có ngay số liệu chuỗi ngày, thời gian học và biểu đồ phân tích.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/luyen-tap">
                <Button size="quiz" className="gap-2">
                  <Dumbbell className="size-4" />
                  <span>Bắt đầu luyện tập ngay</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Chuẩn bị dữ liệu SVG cho Biểu đồ cột (Phút học 14 ngày)
  const maxMinutes = Math.max(...minutes14d.map((d) => d.value), 30);
  const highestMinuteDay = minutes14d.reduce((prev, curr) =>
    curr.value > prev.value ? curr : prev,
  );

  // Chuẩn bị các segment cho Biểu đồ đường (Tỷ lệ đúng 30 ngày)
  // Chỉ vẽ đường nối giữa các ngày liên tiếp có dữ liệu
  const accuracySegments: DayValue[][] = [];
  let currentSegment: DayValue[] = [];

  accuracy30d.forEach((d) => {
    if (d.hasData) {
      currentSegment.push(d);
    } else {
      if (currentSegment.length > 0) {
        accuracySegments.push(currentSegment);
        currentSegment = [];
      }
    }
  });
  if (currentSegment.length > 0) {
    accuracySegments.push(currentSegment);
  }

  const hasAccuracyDataIn30d = accuracy30d.some((d) => d.hasData);

  return (
    <TooltipProvider delay={100}>
      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-8 pb-32 sm:pb-16">
        {/* TIÊU ĐỀ TRANG */}
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Thống kê
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tổng quan tiến trình học tập và độ ổn định ghi nhớ cá nhân.
          </p>
        </div>

        {/* 1. HÀNG BỐN Ô SỐ LIỆU (KPI) */}
        <section aria-label="Các chỉ số chính" className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Ô 1: Chuỗi ngày */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-4 md:p-5 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium uppercase tracking-wider">Chuỗi ngày</span>
                <Flame className="size-4 text-[hsl(var(--chart-1))]" />
              </div>
              <div className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {streak.days}
                {streak.truncated && <span className="text-lg font-normal">+</span>}
                <span className="text-sm font-normal text-muted-foreground ml-1.5">ngày</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {streak.days === 0
                  ? 'Chưa có chuỗi ngày nào'
                  : !hasStudiedToday
                    ? 'Học hôm nay để giữ chuỗi'
                    : 'Đã hoàn thành hôm nay'}
              </p>
            </CardContent>
          </Card>

          {/* Ô 2: Hôm nay */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-4 md:p-5 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium uppercase tracking-wider">Hôm nay</span>
                <Clock className="size-4 text-[hsl(var(--chart-2))]" />
              </div>
              <div className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {todayMinutes}
                <span className="text-sm font-normal text-muted-foreground ml-1.5">phút</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {hasStudiedToday ? 'Thời lượng luyện tập' : 'Chưa luyện tập hôm nay'}
              </p>
            </CardContent>
          </Card>

          {/* Ô 3: Đúng 7 ngày */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-4 md:p-5 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium uppercase tracking-wider">Đúng 7 ngày</span>
                <CheckCircle2 className="size-4 text-[hsl(var(--chart-3))]" />
              </div>
              <div className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {accuracy7d !== null ? `${accuracy7d}%` : '—'}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {accuracy7d !== null ? 'Theo tổng câu trả lời' : 'Chưa có dữ liệu 7 ngày'}
              </p>
            </CardContent>
          </Card>

          {/* Ô 4: Đang theo dõi */}
          <Card className="relative overflow-hidden">
            <CardContent className="p-4 md:p-5 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium uppercase tracking-wider">Đang theo dõi</span>
                <Layers className="size-4 text-[hsl(var(--chart-4))]" />
              </div>
              <div className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {totalReviews.toLocaleString('vi-VN')}
                <span className="text-sm font-normal text-muted-foreground ml-1.5">mục</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                Vào thuật toán FSRS
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 2. LỊCH NHIỆT 12 TUẦN GẦN NHẤT */}
        <section aria-labelledby="heading-heatmap">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle id="heading-heatmap" className="font-heading text-base font-semibold">
                    Lịch nhiệt 12 tuần gần nhất
                  </CardTitle>
                  <CardDescription>
                    Mật độ và thời gian luyện tập qua từng ngày.
                  </CardDescription>
                </div>
                {/* Chú giải độ đậm nhạt */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground self-start sm:self-auto">
                  <span>Ít</span>
                  <div className="flex items-center gap-1">
                    <span className="size-3 rounded-xs bg-muted/60 border border-border/40" title="0 phút" />
                    <span className="size-3 rounded-xs bg-[hsl(var(--chart-1)/0.25)]" title="1-10 phút" />
                    <span className="size-3 rounded-xs bg-[hsl(var(--chart-1)/0.5)]" title="11-20 phút" />
                    <span className="size-3 rounded-xs bg-[hsl(var(--chart-1)/0.75)]" title="21-35 phút" />
                    <span className="size-3 rounded-xs bg-[hsl(var(--chart-1))]" title="> 35 phút" />
                  </div>
                  <span>Nhiều</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Vùng cuộn ngang trên mobile */}
              <div className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none">
                <div className="inline-flex flex-col gap-1.5 min-w-max">
                  {/* Nhãn các thứ trong tuần */}
                  <div className="flex gap-2">
                    <div className="flex flex-col justify-between text-[10px] text-muted-foreground h-[134px] py-0.5 select-none w-6">
                      <span>T2</span>
                      <span>T4</span>
                      <span>T6</span>
                      <span>CN</span>
                    </div>

                    {/* Lưới 12 tuần */}
                    <div className="flex gap-1.5">
                      {heatmapWeeks.map((week, wIdx) => (
                        <div key={wIdx} className="flex flex-col gap-1.5">
                          {week.days.map((day) => (
                            <HeatmapCell key={day.dayKey} day={day} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bảng số liệu có thể thu gọn (A11y / Screen reader) */}
              <div className="border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setShowHeatmapTable(!showHeatmapTable)}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  aria-expanded={showHeatmapTable}
                >
                  <ChevronDown
                    className={cn('size-3.5 transition-transform', showHeatmapTable && 'rotate-180')}
                  />
                  <span>Bảng số liệu chi tiết theo ngày</span>
                </button>

                {showHeatmapTable && (
                  <div className="mt-3 max-h-48 overflow-y-auto rounded-md border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/50 sticky top-0 text-muted-foreground">
                        <tr>
                          <th className="p-2">Ngày</th>
                          <th className="p-2">Thời lượng</th>
                          <th className="p-2">Số phiên</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {heatmapWeeks
                          .flatMap((w) => w.days)
                          .filter((d) => d.sessionCount > 0)
                          .reverse()
                          .map((d) => (
                            <tr key={d.dayKey}>
                              <td className="p-2 font-mono">{d.dayKey}</td>
                              <td className="p-2">{d.minutes} phút</td>
                              <td className="p-2">{d.sessionCount} phiên</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 3. BIỂU ĐỒ CỘT: PHÚT HỌC 14 NGÀY GẦN NHẤT */}
        <section aria-labelledby="heading-bar-chart">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle id="heading-bar-chart" className="font-heading text-base font-semibold">
                Phút học 14 ngày gần nhất
              </CardTitle>
              <CardDescription>
                Thời lượng luyện tập mỗi ngày (làm tròn theo phút).
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="h-56 w-full pt-2">
                <svg
                  viewBox="0 0 560 170"
                  className="w-full h-full overflow-visible"
                  role="img"
                  aria-label={`Biểu đồ cột thời lượng học 14 ngày qua. Ngày cao nhất là ${highestMinuteDay.label} với ${highestMinuteDay.value} phút.`}
                >
                  {/* Đường lưới nền */}
                  <line x1="30" y1="20" x2="550" y2="20" stroke="currentColor" strokeDasharray="3 3" className="text-border/60" strokeWidth="1" />
                  <line x1="30" y1="80" x2="550" y2="80" stroke="currentColor" strokeDasharray="3 3" className="text-border/60" strokeWidth="1" />
                  <line x1="30" y1="140" x2="550" y2="140" stroke="currentColor" className="text-border" strokeWidth="1" />

                  {/* Nhãn trục Y */}
                  <text x="24" y="24" textAnchor="end" className="text-[10px] fill-muted-foreground">
                    {maxMinutes}p
                  </text>
                  <text x="24" y="84" textAnchor="end" className="text-[10px] fill-muted-foreground">
                    {Math.round(maxMinutes / 2)}p
                  </text>
                  <text x="24" y="144" textAnchor="end" className="text-[10px] fill-muted-foreground">
                    0
                  </text>

                  {/* Các cột */}
                  {minutes14d.map((item, index) => {
                    const colWidth = 24;
                    const gap = 13;
                    const x = 38 + index * (colWidth + gap);
                    const barHeight = item.value > 0 ? Math.max(4, Math.round((item.value / maxMinutes) * 120)) : 0;
                    const y = 140 - barHeight;
                    const isHighest = item.value === highestMinuteDay.value && item.value > 0;

                    return (
                      <g key={item.dayKey} className="group">
                        <title>{`${item.label}: ${item.value} phút`}</title>
                        {/* Thanh cột */}
                        {barHeight > 0 && (
                          <rect
                            x={x}
                            y={y}
                            width={colWidth}
                            height={barHeight}
                            rx="3"
                            className={cn(
                              'fill-[hsl(var(--chart-1))] transition-opacity duration-150',
                              isHighest ? 'opacity-100' : 'opacity-85 hover:opacity-100',
                            )}
                          />
                        )}

                        {/* Nhãn số trên cột cao nhất */}
                        {isHighest && (
                          <text
                            x={x + colWidth / 2}
                            y={y - 5}
                            textAnchor="middle"
                            className="text-[10px] font-bold fill-foreground"
                          >
                            {item.value}p
                          </text>
                        )}

                        {/* Nhãn trục X */}
                        <text
                          x={x + colWidth / 2}
                          y="156"
                          textAnchor="middle"
                          className="text-[10px] fill-muted-foreground"
                        >
                          {item.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Bảng số liệu chi tiết */}
              <div className="border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setShowMinutesTable(!showMinutesTable)}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  aria-expanded={showMinutesTable}
                >
                  <ChevronDown
                    className={cn('size-3.5 transition-transform', showMinutesTable && 'rotate-180')}
                  />
                  <span>Bảng số liệu 14 ngày</span>
                </button>

                {showMinutesTable && (
                  <div className="mt-3 max-h-48 overflow-y-auto rounded-md border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/50 sticky top-0 text-muted-foreground">
                        <tr>
                          <th className="p-2">Ngày</th>
                          <th className="p-2">Thời lượng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {minutes14d.map((d) => (
                          <tr key={d.dayKey}>
                            <td className="p-2">{d.label} ({d.dayKey})</td>
                            <td className="p-2">{d.value} phút</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 4. BIỂU ĐỒ ĐƯỜNG: TỶ LỆ ĐÚNG 30 NGÀY GẦN NHẤT */}
        <section aria-labelledby="heading-accuracy-chart">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle id="heading-accuracy-chart" className="font-heading text-base font-semibold">
                Tỷ lệ đúng 30 ngày gần nhất
              </CardTitle>
              <CardDescription>
                Tỷ lệ câu trả lời chính xác qua từng buổi luyện tập. Các khoảng trống thể hiện ngày không học.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="h-56 w-full pt-2">
                {!hasAccuracyDataIn30d ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-md border-border">
                    Không có buổi học nào trong 30 ngày qua
                  </div>
                ) : (
                  <svg
                    viewBox="0 0 600 170"
                    className="w-full h-full overflow-visible"
                    role="img"
                    aria-label="Biểu đồ đường tỷ lệ trả lời đúng trong 30 ngày qua. Ngày không có bài học được để khoảng trống."
                  >
                    {/* Trục Y và đường lưới */}
                    <line x1="34" y1="20" x2="590" y2="20" stroke="currentColor" strokeDasharray="3 3" className="text-border/60" strokeWidth="1" />
                    <line x1="34" y1="75" x2="590" y2="75" stroke="currentColor" strokeDasharray="3 3" className="text-border/60" strokeWidth="1" />
                    <line x1="34" y1="130" x2="590" y2="130" stroke="currentColor" className="text-border" strokeWidth="1" />

                    <text x="28" y="24" textAnchor="end" className="text-[10px] fill-muted-foreground">
                      100%
                    </text>
                    <text x="28" y="79" textAnchor="end" className="text-[10px] fill-muted-foreground">
                      50%
                    </text>
                    <text x="28" y="134" textAnchor="end" className="text-[10px] fill-muted-foreground">
                      0%
                    </text>

                    {/* Vẽ các phân đoạn polyline nối các ngày có dữ liệu liền nhau */}
                    {accuracySegments.map((segment, sIdx) => {
                      if (segment.length <= 1) return null;
                      const points = segment
                        .map((d) => {
                          const idx = accuracy30d.findIndex((item) => item.dayKey === d.dayKey);
                          const x = 38 + idx * 19;
                          const y = 130 - (d.value / 100) * 110;
                          return `${x},${y}`;
                        })
                        .join(' ');

                      return (
                        <polyline
                          key={sIdx}
                          fill="none"
                          stroke="hsl(var(--chart-2))"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={points}
                        />
                      );
                    })}

                    {/* Điểm đánh dấu cho từng ngày có dữ liệu (≥ 8px) */}
                    {accuracy30d.map((item, idx) => {
                      if (!item.hasData) return null;
                      const x = 38 + idx * 19;
                      const y = 130 - (item.value / 100) * 110;

                      return (
                        <g key={item.dayKey} className="group">
                          <title>{`${item.label}: ${item.value}% đúng (${item.correctCount}/${item.totalQuestions} câu)`}</title>
                          <circle
                            cx={x}
                            cy={y}
                            r="4.5"
                            className="fill-[hsl(var(--chart-2))] stroke-card stroke-2 transition-transform hover:scale-125"
                          />
                        </g>
                      );
                    })}

                    {/* Nhãn trục X cho một số mốc ngày (cách 5 ngày) */}
                    {accuracy30d.map((item, idx) => {
                      if (idx % 5 !== 0 && idx !== 29) return null;
                      const x = 38 + idx * 19;
                      return (
                        <text
                          key={item.dayKey}
                          x={x}
                          y="152"
                          textAnchor="middle"
                          className="text-[10px] fill-muted-foreground"
                        >
                          {item.label}
                        </text>
                      );
                    })}
                  </svg>
                )}
              </div>

              {/* Bảng số liệu 30 ngày */}
              <div className="border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setShowAccuracyTable(!showAccuracyTable)}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  aria-expanded={showAccuracyTable}
                >
                  <ChevronDown
                    className={cn('size-3.5 transition-transform', showAccuracyTable && 'rotate-180')}
                  />
                  <span>Bảng số liệu 30 ngày</span>
                </button>

                {showAccuracyTable && (
                  <div className="mt-3 max-h-48 overflow-y-auto rounded-md border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/50 sticky top-0 text-muted-foreground">
                        <tr>
                          <th className="p-2">Ngày</th>
                          <th className="p-2">Tỷ lệ đúng</th>
                          <th className="p-2">Số câu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {accuracy30d
                          .filter((d) => d.hasData)
                          .reverse()
                          .map((d) => (
                            <tr key={d.dayKey}>
                              <td className="p-2">{d.label} ({d.dayKey})</td>
                              <td className="p-2 font-medium">{d.value}%</td>
                              <td className="p-2 text-muted-foreground">
                                {d.correctCount}/{d.totalQuestions} câu ({d.sessionCount} phiên)
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 5. PHÂN BỐ MỤC ĐANG THEO DÕI THEO LOẠI */}
        <section aria-labelledby="heading-distribution">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle id="heading-distribution" className="font-heading text-base font-semibold">
                Phân bố mục đang theo dõi theo loại
              </CardTitle>
              <CardDescription>
                Tổng cộng {totalReviews.toLocaleString('vi-VN')} mục đang được theo dõi trong hàng đợi ôn tập cá nhân.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Thanh ngang nhiều màu biểu thị tỷ lệ */}
              <div className="h-4 w-full rounded-full overflow-hidden flex bg-muted">
                {totalReviews > 0 ? (
                  TARGET_KEYS.map((key) => {
                    const count = targetCounts?.[key] ?? 0;
                    if (count === 0) return null;
                    const percent = (count / totalReviews) * 100;
                    const cfg = TARGET_TYPE_CONFIG[key];

                    return (
                      <div
                        key={key}
                        style={{ width: `${percent}%` }}
                        className={cn('h-full', cfg.bgClass)}
                        title={`${cfg.label}: ${count} mục (${Math.round(percent)}%)`}
                      />
                    );
                  })
                ) : (
                  <div className="h-full w-full bg-muted" />
                )}
              </div>

              {/* Danh sách 5 loại: ô màu nhỏ + chữ thường + số rõ ràng */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
                {TARGET_KEYS.map((key) => {
                  const count = targetCounts?.[key] ?? 0;
                  const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                  const cfg = TARGET_TYPE_CONFIG[key];

                  return (
                    <div
                      key={key}
                      className="p-3 rounded-md border border-border bg-card/60 flex flex-col justify-between gap-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn('size-2.5 rounded-xs shrink-0', cfg.bgClass)} />
                        <span className="text-xs font-medium text-foreground">{cfg.label}</span>
                      </div>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-lg font-bold text-foreground">{count}</span>
                        <span className="text-xs text-muted-foreground">{percent}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 6. LIÊN KẾT ĐIỂM YẾU */}
        <div className="flex justify-end pt-2">
          <Link href="/on-tap/diem-yeu">
            <Button
              variant="outline"
              size="quiz"
              className="gap-2 text-foreground hover:text-primary transition-colors"
            >
              <span>Điểm yếu của tôi</span>
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </main>
    </TooltipProvider>
  );
}

/**
 * Một ô trong lịch nhiệt (HeatmapCell) với Tooltip và accessibility đầy đủ.
 */
function HeatmapCell({ day }: { day: HeatmapDay }) {
  // Mức độ màu 0..4
  const bgColors: Record<0 | 1 | 2 | 3 | 4, string> = {
    0: 'bg-muted/40 border border-border/40 hover:border-foreground/40',
    1: 'bg-[hsl(var(--chart-1)/0.25)] hover:bg-[hsl(var(--chart-1)/0.35)]',
    2: 'bg-[hsl(var(--chart-1)/0.5)] hover:bg-[hsl(var(--chart-1)/0.6)]',
    3: 'bg-[hsl(var(--chart-1)/0.75)] hover:bg-[hsl(var(--chart-1)/0.85)]',
    4: 'bg-[hsl(var(--chart-1))] text-primary-foreground hover:opacity-90',
  };

  const tooltipText = `${day.label} (${day.dayKey}): ${day.minutes} phút · ${day.sessionCount} phiên`;

  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        aria-label={tooltipText}
        className={cn(
          'size-4 rounded-xs shrink-0 transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring outline-none',
          bgColors[day.level],
        )}
      />
      <TooltipContent side="top">
        <p className="text-xs font-medium">{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}
