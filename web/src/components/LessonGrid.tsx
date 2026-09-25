'use client';

import { useState, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/LessonProgress';
import { db } from '@/lib/db';
import { countLearnedByLesson, pickActiveLesson } from '@/lib/stats';
import { DEFAULT_SETTINGS, getSettingsSnapshot, subscribeSettings } from '@/lib/settings';
import type { LessonSummary } from '@/lib/lessons';
import {
  Search,
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { LazyMotion, MotionConfig, domMax, m } from 'framer-motion';
import { Furigana } from '@/components/Furigana';
import { formatOptionalBrackets, stripFurigana } from '@/lib/japanese';


// Nền của lựa chọn đang bật trượt sang nút mới (tabs sliding, 250ms smooth-out).
function FilterPill() {
  return (
    <m.span
      layoutId="lesson-filter-pill"
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 -z-10 rounded-xl bg-primary shadow-sm"
      aria-hidden
    />
  );
}

type FilterType = 'all' | 'completed' | 'in-progress' | 'not-started';

export function LessonGrid({ summaries }: { summaries: LessonSummary[] }) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1 query cho cả lưới
  const targetIds = useLiveQuery(
    () => db.reviewItems.where('targetId').startsWith('vocab-').primaryKeys(),
    [],
    [] as string[]
  );
  const learnedByLesson = useMemo(() => countLearnedByLesson(targetIds), [targetIds]);
  const { learnedThroughLesson } = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    () => DEFAULT_SETTINGS,
  );

  // Phân loại trạng thái các bài học
  const lessonStats = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    let totalVocabInN5 = 0;
    let totalGrammarInN5 = 0;

    for (const s of summaries) {
      totalVocabInN5 += s.vocabCount;
      totalGrammarInN5 += s.grammarCount;
      const learned = learnedByLesson.get(s.number) ?? 0;
      if (s.vocabCount > 0 && learned >= s.vocabCount) {
        completed++;
      } else if (learned > 0) {
        inProgress++;
      } else {
        notStarted++;
      }
    }

    return {
      completed,
      inProgress,
      notStarted,
      activeLessonNum: pickActiveLesson(summaries, learnedByLesson, learnedThroughLesson),
      totalVocabInN5: totalVocabInN5 || 650,
      totalGrammarInN5: totalGrammarInN5 || 98,
    };
  }, [summaries, learnedByLesson, learnedThroughLesson]);

  // Lọc và tìm kiếm bài học
  const filteredSummaries = useMemo(() => {
    return summaries.filter((s) => {
      const learned = learnedByLesson.get(s.number) ?? 0;
      const isCompleted = s.vocabCount > 0 && learned >= s.vocabCount;
      const isInProgress = learned > 0 && !isCompleted;
      const isNotStarted = learned === 0;

      // Filter theo tab
      if (filter === 'completed' && !isCompleted) return false;
      if (filter === 'in-progress' && !isInProgress) return false;
      if (filter === 'not-started' && !isNotStarted) return false;

      // Filter theo ô tìm kiếm
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchNumber = String(s.number) === query;
        const matchVi = s.title?.vi?.toLowerCase().includes(query);
        const rawJp = s.jpTitle?.toLowerCase() ?? '';
        const strippedJp = s.jpTitle ? stripFurigana(formatOptionalBrackets(s.jpTitle)).toLowerCase() : '';
        const matchJp = rawJp.includes(query) || strippedJp.includes(query);
        const matchDesc = s.description?.vi?.toLowerCase().includes(query);
        if (!matchNumber && !matchVi && !matchJp && !matchDesc) return false;
      }

      return true;
    });
  }, [summaries, learnedByLesson, filter, searchQuery]);

  return (
    <div className="space-y-5">
      {/* 1. Thẻ học tiếp trên cùng + Dải thống kê thu gọn */}
      <section className="space-y-3">
        {/* Thẻ "học tiếp" 1 hàng gọn dùng tiêu đề bài thật */}
        {(() => {
          const activeLesson = summaries.find((s) => s.number === lessonStats.activeLessonNum);
          if (!activeLesson) return null;
          return (
            <Card className="rounded-2xl border border-primary/30 bg-primary/5 p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="shrink-0 size-2.5 rounded-full bg-primary" />
                <span className="shrink-0 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  Học tiếp
                </span>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm sm:text-base text-foreground truncate">
                    Bài {activeLesson.number}: {activeLesson.title?.vi ?? 'Minna no Nihongo'}
                  </h4>
                  {activeLesson.jpTitle && (
                    <div className="font-jp text-xs text-muted-foreground truncate">
                      <Furigana text={formatOptionalBrackets(activeLesson.jpTitle)} zoomable={false} />
                    </div>
                  )}
                </div>
              </div>
              <Link
                href={`/hoc/${activeLesson.number}`}
                className={cn(
                  buttonVariants({ size: 'default' }),
                  'min-h-11 h-11 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 px-4 shadow-sm'
                )}
              >
                <span>Học tiếp ngay</span>
                <ArrowRight className="size-4" />
              </Link>
            </Card>
          );
        })()}

        {/* Dải thống kê thu gọn: tiến độ bài + từ vựng (bỏ khối ngữ pháp 40% giả) */}
        <Card className="rounded-2xl border-border/80 bg-card p-3 sm:p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3 sm:gap-6 divide-x divide-border/60">
            {/* Tiến độ bài học N5 */}
            <div className="space-y-1.5 pr-1 sm:pr-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                  Tiến độ bài học
                </span>
                <span className="font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded text-[11px]">
                  {Math.round((lessonStats.completed / Math.max(1, summaries.length)) * 100)}%
                </span>
              </div>
              <div className="text-base sm:text-xl font-bold text-foreground">
                {lessonStats.completed} <span className="text-xs font-normal text-muted-foreground">/ {summaries.length} bài</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-[width] duration-250 ease-smooth-out"
                  style={{ width: `${Math.round((lessonStats.completed / Math.max(1, summaries.length)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Từ vựng đã nắm */}
            <div className="space-y-1.5 pl-3 sm:pl-6">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                  Từ vựng đã học
                </span>
                <span className="font-bold text-success bg-success/10 px-1.5 py-0.2 rounded text-[11px]">
                  {Math.round((targetIds.length / lessonStats.totalVocabInN5) * 100)}%
                </span>
              </div>
              <div className="text-base sm:text-xl font-bold text-foreground">
                {targetIds.length} <span className="text-xs font-normal text-muted-foreground">/ {lessonStats.totalVocabInN5} từ</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-success h-full rounded-full transition-[width] duration-250 ease-smooth-out"
                  style={{ width: `${Math.min(100, Math.round((targetIds.length / lessonStats.totalVocabInN5) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 2. Thanh công cụ Lọc & Tìm kiếm */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 border-t border-border/80">
        {/* Segmented Filter Buttons - 4 lựa chọn hiển thị đủ trên 390px không cuộn ngang, touch target >= 44px */}
        <LazyMotion features={domMax} strict>
          <MotionConfig reducedMotion="user">
            <div className="grid grid-cols-2 gap-1.5 sm:flex sm:items-center bg-card p-1.5 rounded-2xl border border-border/80 shadow-sm">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={cn(
                  'relative isolate min-h-11 h-11 px-3 rounded-xl text-xs font-medium transition-colors flex items-center justify-center text-center',
                  filter === 'all'
                    ? 'text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {filter === 'all' && <FilterPill />}
                Tất cả ({summaries.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('completed')}
                className={cn(
                  'relative isolate min-h-11 h-11 px-3 rounded-xl text-xs font-medium transition-colors flex items-center justify-center text-center',
                  filter === 'completed'
                    ? 'text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {filter === 'completed' && <FilterPill />}
                Đã hoàn thành ({lessonStats.completed})
              </button>
              <button
                type="button"
                onClick={() => setFilter('in-progress')}
                className={cn(
                  'relative isolate min-h-11 h-11 px-3 rounded-xl text-xs font-medium transition-colors flex items-center justify-center text-center',
                  filter === 'in-progress'
                    ? 'text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {filter === 'in-progress' && <FilterPill />}
                Đang học ({lessonStats.inProgress})
              </button>
              <button
                type="button"
                onClick={() => setFilter('not-started')}
                className={cn(
                  'relative isolate min-h-11 h-11 px-3 rounded-xl text-xs font-medium transition-colors flex items-center justify-center text-center',
                  filter === 'not-started'
                    ? 'text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {filter === 'not-started' && <FilterPill />}
                Chưa bắt đầu ({lessonStats.notStarted})
              </button>
            </div>
          </MotionConfig>
        </LazyMotion>

        {/* Search Box - chiều cao >= 44px */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-72">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bài học, chủ đề tiếng Nhật..."
              className="w-full min-h-11 h-11 pl-9 pr-4 bg-card border border-border/80 rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
            />
          </div>
          <div className="hidden sm:flex items-center text-xs text-muted-foreground px-3 min-h-11 h-11 bg-card rounded-xl border border-border/80 shadow-sm">
            <span>{filteredSummaries.length}/{summaries.length}</span>
          </div>
        </div>
      </div>

      {/* 3. Lưới Thẻ Bài Học Washi */}
      {filteredSummaries.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-border/80 bg-card space-y-2">
          <BookOpen className="size-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">Không tìm thấy bài học phù hợp</h3>
          <p className="text-xs text-muted-foreground">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn tab bộ lọc khác.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
          {filteredSummaries.map((s) => {
            const hasTranslation = Boolean(s.title?.vi);
            const learned = learnedByLesson.get(s.number) ?? 0;
            const isCompleted = s.vocabCount > 0 && learned >= s.vocabCount;
            const isInProgress = learned > 0 && !isCompleted;

            if (!hasTranslation) {
              return (
                <div key={s.number} className="rounded-2xl opacity-50 cursor-not-allowed">
                  <Card className="h-full rounded-2xl border-border/80 bg-card p-3.5 sm:p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">
                        Bài {s.number}
                      </span>
                      <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        Chưa có bản dịch
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {s.vocabCount} từ · {s.grammarCount} mẫu ngữ pháp
                      </p>
                    </div>
                  </Card>
                </div>
              );
            }

            return (
              <Link
                key={s.number}
                href={`/hoc/${s.number}`}
                className="group outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-2xl block"
              >
                <Card className="h-full rounded-2xl border-border/80 bg-card px-3.5 py-3 sm:p-4 shadow-sm hover:shadow-md hover:border-primary/40 transition flex flex-col justify-between gap-2 relative">
                  <div className="space-y-1">
                    {/* Header thẻ: 1 nhãn "Bài N" + Badge trạng thái */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-foreground">
                        Bài {s.number}
                      </span>
                      {isCompleted ? (
                        <span className="text-[11px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-md border border-success/20 flex items-center gap-1">
                          <CheckCircle2 className="size-3" />
                          Hoàn thành
                        </span>
                      ) : isInProgress ? (
                        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 flex items-center gap-1">
                          <Clock className="size-3" />
                          Đang học ({Math.round((learned / s.vocabCount) * 100)}%)
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                          Chưa bắt đầu
                        </span>
                      )}
                    </div>

                    {/* Tiêu đề tiếng Việt */}
                    <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {s.title.vi}
                    </h3>

                    {/* Tiếng Nhật (Furigana) */}
                    {s.jpTitle && (
                      <div className="font-jp text-xs font-medium text-muted-foreground">
                        <Furigana text={formatOptionalBrackets(s.jpTitle)} zoomable={false} />
                      </div>
                    )}

                    {/* Mô tả: chỉ desktop — trên mobile tiêu đề + tiếng Nhật đủ để chọn bài */}
                    {s.description?.vi && (
                      <p className="hidden sm:block text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                        {s.description.vi}
                      </p>
                    )}
                  </div>

                  {/* 1 dòng tiến độ gọn */}
                  <div className="pt-1.5 border-t border-border/60">
                    <ProgressBar learned={learned} total={s.vocabCount} />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
