import type { AnswerResult, QuestionItem } from '@/types';

/** Hợp đồng chung của cả 5 dạng bài. Wrapper không cần biết dạng nào đang chạy. */
export interface QuestionProps {
  question: QuestionItem;
  /** Đã trả lời xong; component chuyển sang trạng thái chỉ đọc, hiện đúng/sai. */
  answered: boolean;
  onAnswer: (results: AnswerResult[]) => void;
}
