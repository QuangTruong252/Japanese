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
        const matchJp = s.jpTitle?.toLowerCase().includes(query);
        const matchDesc = s.description?.vi?.toLowerCase().includes(query);
        if (!matchNumber && !matchVi && !matchJp && !matchDesc) return false;
      }

      return true;
    });
  }, [summaries, learnedByLesson, filter, searchQuery]);

  return (
    <div className="space-y-8">
      {/* 1. Bento Progress Banner đầu trang (Phong cách Stitch) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Tiến độ bài học N5 */}
        <Card className="rounded-2xl border-border/80 bg-card p-5 shadow-sm flex flex-col justify-between hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tiến độ N5
            </span>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              {Math.round((lessonStats.completed / Math.max(1, summaries.length)) * 100)}%
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-foreground">
              {lessonStats.completed} <span className="text-sm font-normal text-muted-foreground">/ {summaries.length} bài</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lessonStats.inProgress} bài đang học dở
            </p>
          </div>
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.round((lessonStats.completed / Math.max(1, summaries.length)) * 100)}%` }}
            />
          </div>
        </Card>

        {/* Thẻ 2: Từ vựng đã nắm */}
        <Card className="rounded-2xl border-border/80 bg-card p-5 shadow-sm flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Từ vựng đã học
            </span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              {Math.round((targetIds.length / lessonStats.totalVocabInN5) * 100)}%
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-foreground">
              {targetIds.length} <span className="text-sm font-normal text-muted-foreground">/ {lessonStats.totalVocabInN5} từ</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Đã đưa vào lịch ôn tập FSRS
            </p>
          </div>
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.round((targetIds.length / lessonStats.totalVocabInN5) * 100))}%` }}
            />
          </div>
        </Card>

        {/* Thẻ 3: Ngữ pháp Minna */}
        <Card className="rounded-2xl border-border/80 bg-card p-5 shadow-sm flex flex-col justify-between hover:border-border/80 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Ngữ pháp Minna
            </span>
            <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              N5
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-foreground">
              {lessonStats.totalGrammarInN5} <span className="text-sm font-normal text-muted-foreground">mẫu câu</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Toàn bộ cấu trúc trọng điểm N5
            </p>
          </div>
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
            <div className="bg-foreground/40 h-full rounded-full" style={{ width: '40%' }} />
          </div>
        </Card>

        {/* Thẻ 4: Bài đang học CTA */}
        <Card className="rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-card p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Khuyên học
            </span>
            <span className="text-xs font-bold text-primary">
              Bài {lessonStats.activeLessonNum}
            </span>
          </div>
          <div className="my-2">
            <h4 className="font-bold text-sm text-foreground truncate">
              Bài {lessonStats.activeLessonNum}: Minna no Nihongo
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tiếp tục bài học gần nhất của bạn
            </p>
          </div>
          <Link
            href={`/hoc/${lessonStats.activeLessonNum}`}
            className={cn(
              buttonVariants({ size: 'sm' }),
              'w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm'
            )}
          >
            <span>Học tiếp ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Card>
      </section>

      {/* 2. Thanh công cụ Lọc & Tìm kiếm */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-border/80">
        {/* Segmented Filter Buttons */}
        <div className="flex items-center gap-1 bg-card p-1 rounded-2xl border border-border/80 shadow-sm overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap',
              filter === 'all'
                ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            Tất cả ({summaries.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap',
              filter === 'completed'
                ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            Đã hoàn thành ({lessonStats.completed})
          </button>
          <button
            type="button"
            onClick={() => setFilter('in-progress')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap',
              filter === 'in-progress'
                ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            Đang học ({lessonStats.inProgress})
          </button>
          <button
            type="button"
            onClick={() => setFilter('not-started')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap',
              filter === 'not-started'
                ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            Chưa học ({lessonStats.notStarted})
          </button>
        </div>

        {/* Search Box */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bài học, chủ đề tiếng Nhật..."
              className="w-full pl-9 pr-4 py-2 bg-card border border-border/80 rounded-xl text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
            />
          </div>
          <div className="hidden sm:flex items-center text-xs text-muted-foreground px-2.5 py-1.5 bg-card rounded-xl border border-border/80 shadow-sm">
            <span>{filteredSummaries.length}/{summaries.length}</span>
          </div>
        </div>
      </div>

      {/* 3. Lưới Thẻ Bài Học Washi */}
      {filteredSummaries.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-border/80 bg-card space-y-2">
          <BookOpen className="w-8 h-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">Không tìm thấy bài học phù hợp</h3>
          <p className="text-xs text-muted-foreground">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn tab bộ lọc khác.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSummaries.map((s) => {
            const hasTranslation = Boolean(s.title?.vi);
            const learned = learnedByLesson.get(s.number) ?? 0;
            const isCompleted = s.vocabCount > 0 && learned >= s.vocabCount;
            const isInProgress = learned > 0 && !isCompleted;

            if (!hasTranslation) {
              return (
                <div key={s.number} className="rounded-2xl opacity-50 cursor-not-allowed">
                  <Card className="h-full rounded-2xl border-border/80 bg-card p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        Chưa có bản dịch
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        Bài {s.number}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-foreground">Bài {s.number}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
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
                className="group outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-2xl"
              >
                <Card className="h-full rounded-2xl border-border/80 bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between relative">
                  <div className="space-y-3">
                    {/* Badge Trạng thái */}
                    <div className="flex items-center justify-between">
                      {isCompleted ? (
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Hoàn thành
                        </span>
                      ) : isInProgress ? (
                        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Đang học ({Math.round((learned / s.vocabCount) * 100)}%)
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                          Chưa học
                        </span>
                      )}

                      <span className="text-xs font-bold text-muted-foreground">
                        Bài {s.number}
                      </span>
                    </div>

                    {/* Tiêu đề bài học */}
                    <div>
                      <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                        Bài {s.number} — {s.title.vi}
                      </h3>
                      {s.jpTitle && (
                        <p className="font-jp text-xs font-medium text-muted-foreground mt-0.5">
                          {s.jpTitle}
                        </p>
                      )}
                      {s.description?.vi && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                          {s.description.vi}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Thanh tiến độ và số lượng từ vựng */}
                  <div className="pt-4 mt-2 border-t border-border/60 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{s.vocabCount} từ · {s.grammarCount} ngữ pháp</span>
                      <span className="font-medium text-foreground">{learned}/{s.vocabCount}</span>
                    </div>
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
