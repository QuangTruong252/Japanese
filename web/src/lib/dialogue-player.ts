/** Phần của SpeechSynthesisUtterance mà bộ phát cần; tách ra để test không cần trình duyệt. */
type Utterance = Pick<EventTarget, 'addEventListener'>;

let current: (() => void) | null = null;

/**
 * Đọc lần lượt `count` câu: câu kế tiếp bắt đầu khi câu trước kết thúc.
 * `speakAt(i)` trả null khi không đọc được (không có TTS) thì dừng luôn.
 * Trả về hàm dừng. Lỗi của câu đang đọc (kể cả do câu khác gọi `cancel()` chen vào) cũng dừng cả chuỗi,
 * nên bấm nghe một câu lẻ giữa chừng không để chuỗi cũ đọc tiếp chồng lên.
 */
export function playLines(
  count: number,
  speakAt: (index: number) => Utterance | null,
  onActive: (index: number | null) => void,
): () => void {
  // Chỉ một chuỗi hiện hành: chuỗi cũ bị dừng trước, nên sự kiện kết thúc/hủy của nó tới muộn cũng bị bỏ qua.
  current?.();
  let stopped = false;
  const finish = () => {
    if (stopped) return;
    stopped = true;
    if (current === finish) current = null;
    onActive(null);
  };
  current = finish;
  const play = (index: number) => {
    if (stopped) return;
    if (index >= count) return finish();
    const utterance = speakAt(index);
    if (!utterance) return finish();
    onActive(index);
    utterance.addEventListener('end', () => play(index + 1));
    utterance.addEventListener('error', finish);
  };
  play(0);
  return finish;
}
