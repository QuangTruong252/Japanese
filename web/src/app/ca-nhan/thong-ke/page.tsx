import type { Metadata } from 'next';
import { StatisticsContent } from '@/components/stats/StatisticsContent';

export const metadata: Metadata = {
  title: 'Thống kê học tập · MaiPace',
  description: 'Tổng quan tiến trình học tập, chuỗi ngày, biểu đồ thời gian và tỷ lệ chính xác.',
};

export default function CaNhanThongKePage() {
  return <StatisticsContent />;
}
