import type { Metadata } from 'next';
import { WritingPicker } from './WritingPicker';

export const metadata: Metadata = {
  title: 'Luyện viết · MaiPace',
};

export default function WritingPage() {
  return <WritingPicker />;
}
