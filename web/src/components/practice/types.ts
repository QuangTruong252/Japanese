import type { AnswerResult, QuestionItem } from '@/types';

/** Hợp đồng chung của cả 5 dạng bài. Wrapper không cần biết dạng nào đang chạy. */
export interface QuestionProps {
  question: QuestionItem;
  /** Đã trả lời xong; component chuyển sang trạng thái chỉ đọc, hiện đúng/sai. */
  answered: boolean;
  onAnswer: (results: AnswerResult[]) => void;
  /** Phiên đang tạm dừng: câu vẫn mounted (giữ chữ đang gõ) nhưng phím tắt toàn cục phải im. */
  paused?: boolean;
}
