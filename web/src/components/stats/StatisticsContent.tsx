'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight } from 'lucide-react';
import { db } from '@/lib/db';
import { useDueClock } from '@/lib/use-due-clock';
import { DEFAULT_SETTINGS, getSettingsSnapshot, subscribeSettings } from '@/lib/settings';
import { loadLessonSummaries, type LessonSummary } from '@/lib/lessons';
import {
  currentStreak,
  secondsOnDay,
  minutesOnDay,
  accuracyOverDays,
  dailyMinutes,
  dailyAccuracy,
  targetsByType,
  activityHeatmap,
  countLearnedByLesson,
  pickActiveLesson,
  resolveStatsEmptyState,
} from '@/lib/stats';
import { TornCard, SectionHeader, ListRow } from '@/components/PaperKit';
import { FeatureIcon } from '@/components/FeatureIcon';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';
import { StatTile } from '@/components/stats/StatTile';
import { ChartSection } from '@/components/stats/ChartSection';
import { HeatmapChart } from '@/components/stats/HeatmapChart';
import { MinutesBarChart, AccuracyLineChart } from '@/components/stats/LineAndBarCharts';
import { TargetDistribution } from '@/components/stats/TargetDistribution';
import { cn } from '@/lib/utils';

const TABLE_HEAD = 'sticky top-0 bg-secondary text-muted-foreground';

export function StatisticsContent() {
  const now = useDueClock();

  const sessions = useLiveQuery(() => db.practiceSessions.orderBy('createdAt').toArray());
  const reviewItems = useLiveQuery(() => db.reviewItems.toArray());
  const dueCount =
    useLiveQuery(
      () => db.reviewItems.where('dueAt').belowOrEqual(now).count(),
      [now]
    ) ?? 0;

  const { learnedThroughLesson } = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    () => DEFAULT_SETTINGS,
  );

  const [summaries, setSummaries] = useState<LessonSummary[]>([]);
  useEffect(() => {
    let active = true;
    loadLessonSummaries().then((data) => {
      if (active) setSummaries(data);
    });
    return () => {
      active = false;
    };
  }, []);

  const learnedByLesson = useMemo(() => {
    if (!reviewItems) return new Map<number, number>();
    const targetIds = reviewItems.map((item) => item.targetId);
    return countLearnedByLesson(targetIds);
  }, [reviewItems]);

  const activeLessonNum = useMemo(() => {
    if (summaries.length === 0) return 1;
    return pickActiveLesson(summaries, learnedByLesson, learnedThroughLesson);
  }, [summaries, learnedByLesson, learnedThroughLesson]);

  const streak = useMemo(
    () => (sessions ? currentStreak(sessions, now) : { days: 0, truncated: false }),
    [sessions, now],
  );
  const todaySeconds = useMemo(
    () => (sessions ? secondsOnDay(sessions, now) : 0),
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

  const heatmapWeeks = useMemo(
    () => (sessions ? activityHeatmap(sessions, 12, now) : []),
    [sessions, now],
  );
  const minutes14d = useMemo(
    () => (sessions ? dailyMinutes(sessions, 14, now) : []),
    [sessions, now],
  );
  const accuracy30d = useMemo(
    () => (sessions ? dailyAccuracy(sessions, 30, now) : []),
    [sessions, now],
  );
  const targetCounts = useMemo(
    () => (reviewItems ? targetsByType(reviewItems) : null),
    [reviewItems],
  );

  const emptyState = useMemo(() => {
    if (!sessions || !reviewItems) return null;
    return resolveStatsEmptyState({
      sessionCount: sessions.length,
      reviewItemCount: reviewItems.length,
      learnedThroughLesson,
      dueCount,
      activeLessonNum,
    });
  }, [sessions, reviewItems, learnedThroughLesson, dueCount, activeLessonNum]);

  if (sessions === undefined || reviewItems === undefined) {
    return (
      <div className="space-y-8 animate-pulse" aria-busy="true">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-52 w-full rounded-xl" />
      </div>
    );
  }

  if (emptyState?.isEmpty && emptyState.cta) {
    return (
      <TornCard className="space-y-4 text-center">
        <h2 className="font-serif text-xl font-semibold text-foreground">{emptyState.title}</h2>
        <Link
          href={emptyState.cta.href}
          className={cn(buttonVariants({ size: 'quiz' }), 'w-full font-semibold sm:w-auto sm:px-6')}
        >
          {emptyState.cta.label}
          <ArrowRight aria-hidden="true" />
        </Link>
      </TornCard>
    );
  }

  const hasAccuracyDataIn30d = accuracy30d.some((d) => d.hasData);

  return (
    <TooltipProvider delay={100}>
      <div className="space-y-8">
        <section aria-label="Các chỉ số chính" className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile
            label="Chuỗi ngày"
            value={
              <>
                {streak.days}
                {streak.truncated && '+'}
              </>
            }
            unit="ngày"
          />
          {todaySeconds > 0 && todaySeconds < 60 ? (
            <StatTile label="Hôm nay" value="Dưới 1" unit="phút" />
          ) : (
            <StatTile label="Hôm nay" value={todayMinutes} unit="phút" />
          )}
          <StatTile label="Đúng 7 ngày" value={accuracy7d !== null ? `${accuracy7d}%` : '—'} />
          <StatTile label="Đang theo dõi" value={totalReviews.toLocaleString('vi-VN')} unit="mục" />
        </section>

        <ChartSection
          id="heading-heatmap"
          title="Lịch nhiệt 12 tuần gần nhất"
          tableLabel="Bảng số liệu chi tiết theo ngày"
          table={
            <table className="w-full text-left text-sm">
              <thead className={TABLE_HEAD}>
                <tr>
                  <th className="p-2 font-medium">Ngày</th>
                  <th className="p-2 font-medium">Thời lượng</th>
                  <th className="p-2 font-medium">Số phiên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {heatmapWeeks
                  .flatMap((w) => w.days)
                  .filter((d) => d.sessionCount > 0)
                  .reverse()
                  .map((d) => (
                    <tr key={d.dayKey}>
                      <td className="p-2 tabular-nums">{d.dayKey}</td>
                      <td className="p-2">{d.minutes} phút</td>
                      <td className="p-2">{d.sessionCount} phiên</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          }
        >
          <HeatmapChart weeks={heatmapWeeks} now={now} />
        </ChartSection>

        <ChartSection
          id="heading-bar-chart"
          title="Phút học 14 ngày gần nhất"
          tableLabel="Bảng số liệu 14 ngày"
          table={
            <table className="w-full text-left text-sm">
              <thead className={TABLE_HEAD}>
                <tr>
                  <th className="p-2 font-medium">Ngày</th>
                  <th className="p-2 font-medium">Thời lượng</th>
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
          }
        >
          <MinutesBarChart data={minutes14d} />
        </ChartSection>

        <ChartSection
          id="heading-accuracy-chart"
          title="Tỷ lệ đúng 30 ngày gần nhất"
          tableLabel="Bảng số liệu 30 ngày"
          table={
            <table className="w-full text-left text-sm">
              <thead className={TABLE_HEAD}>
                <tr>
                  <th className="p-2 font-medium">Ngày</th>
                  <th className="p-2 font-medium">Tỷ lệ đúng</th>
                  <th className="p-2 font-medium">Số câu</th>
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
          }
        >
          {hasAccuracyDataIn30d ? (
            <AccuracyLineChart data={accuracy30d} />
          ) : (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Không có buổi học nào trong 30 ngày qua
            </p>
          )}
        </ChartSection>

        <section aria-labelledby="heading-distribution">
          <SectionHeader id="heading-distribution" title="Phân bố theo loại" />
          <TargetDistribution counts={targetCounts} total={totalReviews} />
        </section>

        <ListRow
          href="/on-tap/diem-yeu"
          icon={<FeatureIcon name="weak-points" />}
          title="Điểm yếu của tôi"
        />
      </div>
    </TooltipProvider>
  );
}
