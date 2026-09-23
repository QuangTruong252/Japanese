import { loadLessonSummaries } from '@/lib/lessons';
import { DashboardContent } from '@/components/DashboardContent';

export default async function DashboardPage() {
  const summaries = await loadLessonSummaries();
  return <DashboardContent summaries={summaries} />;
}
