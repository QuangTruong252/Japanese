# Kế hoạch triển khai SPEC-10 — Trình phát Shadowing (A-B repeat)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng trình phát âm thanh Shadowing Player cho phép lặp đoạn A-B, điều chỉnh tốc độ đọc, tua ±10s, phím tắt và hiển thị câu ví dụ tham khảo tích hợp vào cuối màn hình chi tiết bài học `/hoc/[so]` theo mockup `mock/21-shadowing.png`.

**Architecture:** Tách biệt 2 tầng: tầng logic tính toán mốc lặp và phím tắt thuần túy (`src/lib/shadowing.ts`) kiểm thử 100% bằng unit test; tầng React Client Component (`ShadowingPlayer.tsx`) kết nối với IndexedDB (`db.audioFiles`), quản lý vòng đời `URL.revokeObjectURL` an toàn và tích hợp vào Server Component `/hoc/[so]/page.tsx`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Dexie 4 (`dexie-react-hooks`), Zustand (`useUIStore`), Lucide React, Base UI / Tailwind CSS.

## Global Constraints

- **Không rò rỉ bộ nhớ (SPEC-10 §2.1):** Luôn gọi `URL.revokeObjectURL(url)` khi đổi track hoặc component unmount.
- **Ràng buộc mốc lặp (SPEC-10 §2.2):** `B > A + 0.5s`, tự động hoán đổi nếu B < A, quay lại mốc A không ngắt tiếng (không gọi `pause()` rồi `play()`).
- **Trung thực về dữ liệu (SPEC-10 §2.4):** Khối ví dụ mang nhãn "Câu ví dụ tham khảo", ghi chú "Không phải bản chép lời của track. Chưa đối chiếu với nội dung track.", không dùng AI bịa transcript.
- **Không hardcode màu sắc:** Sử dụng token Washi (`bg-primary`, `bg-card`, `border-border`, `text-foreground`, ...).

---

### Task 1: Xây dựng Thư viện thuần `src/lib/shadowing.ts` và Unit Test

**Files:**
- Create: `web/src/lib/shadowing.ts`
- Create: `web/src/lib/shadowing.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export function formatTime(seconds: number): string;
  export function normalizeLoopPoints(
    a: number | null,
    b: number | null,
    duration: number
  ): { loopA: number; loopB: number } | null;
  export function isTypingTarget(target: EventTarget | null): boolean;
  ```

- [ ] **Step 1: Viết unit tests kiểm thử các hàm tính toán của `shadowing`**
Tạo file `web/src/lib/shadowing.test.ts`:
1. `formatTime`: kiểm tra 0 -> `00:00`, 42 -> `00:42`, 75 -> `01:15`, 195 -> `03:15`, số âm hoặc NaN -> `00:00`.
2. `normalizeLoopPoints`:
   - Trả về `null` nếu thiếu mốc A hoặc B.
   - Khi A = 10, B = 20, duration = 100 -> `{ loopA: 10, loopB: 20 }`.
   - Tự động hoán đổi khi đặt B trước A: A = 30, B = 10 -> `{ loopA: 10, loopB: 30 }`.
   - Ràng buộc khoảng cách tối thiểu 0.5s: A = 10, B = 10.2 -> `{ loopA: 10, loopB: 10.5 }`.
   - Giới hạn trong khoảng `[0, duration]`.
3. `isTypingTarget`: trả về `true` khi target là HTMLInputElement, HTMLTextAreaElement, hoặc phần tử có `isContentEditable`.

- [ ] **Step 2: Chạy unit test để xác nhận test FAIL**
Run: `cd web && node --test src/lib/shadowing.test.ts`
Expected: FAIL với lỗi "Cannot find module '@/lib/shadowing'".

- [ ] **Step 3: Triển khai mã nguồn `web/src/lib/shadowing.ts`**
Viết implementation các hàm `formatTime`, `normalizeLoopPoints`, `isTypingTarget`.

- [ ] **Step 4: Chạy lại unit test để xác nhận test PASS**
Run: `cd web && node --test src/lib/shadowing.test.ts`
Expected: PASS toàn bộ các test cases.

- [ ] **Step 5: Kiểm tra lint và typecheck**
Run: `cd web && pnpm check`
Expected: 0 errors.

---

### Task 2: Xây dựng Component `src/components/audio/ShadowingPlayer.tsx`

**Files:**
- Create: `web/src/components/audio/ShadowingPlayer.tsx`

**Interfaces:**
- Consumes: `db.audioFiles` qua `useLiveQuery`, `useUIStore`, `formatTime`, `normalizeLoopPoints`, `isTypingTarget` từ `@/lib/shadowing`, `Furigana` từ `@/components/Furigana`, `SpeakButton` từ `@/components/SpeakButton`.
- Produces:
  ```ts
  export interface ShadowingPlayerProps {
    lessonNum: number;
    examples?: Array<{
      jp: string;
      translation: { vi: string };
    }>;
  }
  export function ShadowingPlayer(props: ShadowingPlayerProps): React.JSX.Element;
  ```

- [ ] **Step 1: Triển khai component `ShadowingPlayer.tsx`**
1. Đọc danh sách audio của bài hiện tại: `useLiveQuery(() => db.audioFiles.where('lesson').equals(lessonNum).toArray(), [lessonNum])`.
2. Quản lý trạng thái:
   - `selectedType`: mặc định là track đầu tiên có sẵn (ưu tiên `conversation` hoặc `vocab`).
   - `currentTime`, `duration`, `isLoopActive`.
   - Lấy `playbackRate`, `loopA`, `loopB`, `showTranscript` từ `useUIStore`.
3. Quản lý blob URL & dọn dẹp bộ nhớ:
   - Tạo URL: `URL.createObjectURL(trackRecord.blob)`.
   - `useEffect` giải phóng URL bằng `URL.revokeObjectURL(url)` khi đổi track hoặc unmount.
4. Điều khiển phát & Lặp A-B:
   - Lắng nghe `timeupdate`: nếu `isLoopActive` và `currentTime >= loopB`, đặt `audio.currentTime = loopA`.
   - `audio.playbackRate = playbackRate`.
5. Đăng ký phím tắt bàn phím (`Space`, `[`, `]`, `R`, `T`, `ArrowLeft`, `ArrowRight`):
   - Kiểm tra `!isTypingTarget(e.target)`.
   - Chặn cuộn trang khi bấm `Space` bằng `e.preventDefault()`.
6. Dựng giao diện theo sát `mock/21-shadowing.png`:
   - Hàng tab chọn 4 track có gạch chân màu đỏ (`border-primary`).
   - Scrubber tiến trình có đánh dấu vạch A và B, vùng lặp tô nhẹ `bg-primary/15`, hiển thị thời gian `mm:ss / mm:ss`.
   - Nút Play/Pause tròn 56px (`bg-primary`), 2 nút tua ±10s (44px).
   - Chip chọn tốc độ: `0.75×`, `0.85×`, `1.0×`, `1.2×`.
   - Hàng nút hành động: `Đặt A`, `Đặt B`, `Lặp`, `Câu ví dụ`.
   - Khối Câu ví dụ tham khảo (hiển thị khi chọn track `examples` hoặc khi bật): thẻ chứa Furigana, bản dịch và dòng cảnh báo trung thực.
   - Trạng thái chưa nạp audio: hiển thị card mời nạp dẫn sang `/cai-dat/audio`.

- [ ] **Step 2: Kiểm tra typecheck và lint**
Run: `cd web && pnpm check`
Expected: 0 errors.

---

### Task 3: Tích hợp `ShadowingPlayer` vào Màn hình `/hoc/[so]`

**Files:**
- Modify: `web/src/app/hoc/[so]/page.tsx`

**Interfaces:**
- Nhúng `ShadowingPlayer` vào cuối trang chi tiết bài học trước phần CTA/Nguồn.

- [ ] **Step 1: Import `ShadowingPlayer` vào `LessonDetailPage`**
1. Lấy toàn bộ câu ví dụ ngữ pháp của bài học:
   ```ts
   const examples = lesson.grammar.flatMap((g) => g.examples);
   ```
2. Thêm Section Audio vào trang:
   ```tsx
   {/* 4. Khối Audio & Shadowing Player (SPEC-10) */}
   <section className="space-y-4 pt-4 border-t border-border/80">
     <div className="space-y-1">
       <h2 className="text-xl font-bold text-foreground">Audio & Shadowing</h2>
       <p className="text-sm text-muted-foreground">
         Luyện nghe và nói theo bài học với tính năng lặp đoạn A-B và điều chỉnh tốc độ.
       </p>
     </div>
     <ShadowingPlayer lessonNum={lessonNum} examples={examples} />
   </section>
   ```

- [ ] **Step 2: Chạy kiểm tra tĩnh và tests**
Run: `cd web && pnpm check && pnpm test`
Expected: 0 errors, 100% tests pass.

---

### Task 4: Kiểm chứng Toàn diện & Cập nhật Handoff

**Files:**
- Create: `docs/handoff/SPEC-10.md`
- Modify: `docs/specs/README.md`

- [ ] **Step 1: Chạy toàn bộ static gates & build**
Run: `cd web && pnpm check && pnpm test && pnpm build`
Expected:
- `pnpm check`: Exit code 0.
- `pnpm test`: Toàn bộ unit tests pass 100%.
- `pnpm build`: Next.js export 25 trang bài học `/hoc/1`..`/hoc/25` thành công kèm `ShadowingPlayer`.

- [ ] **Step 2: Tạo tài liệu handoff `docs/handoff/SPEC-10.md`**
Ghi lại ngày triển khai, các quyết định kiến trúc (Blob URL revocation, A-B loop timeupdate, phím tắt an toàn, nhãn trung thực), kết quả kiểm tra tự động và bước tiếp theo (SPEC-12 & SPEC-13).

- [ ] **Step 3: Cập nhật `docs/specs/README.md`**
Đánh dấu SPEC-10 hoàn thành trong chỉ mục spec.
