# Handoff — SPEC-17 (Tra cứu dễ thấy và tìm kiếm đích tính năng)

Ngày: 27/09/2026. Trạng thái: Đã hoàn tất mã nguồn, component Tra cứu Hub và nhóm kết quả Tính năng trong tìm kiếm toàn cục; Targeted Unit Tests & Toàn bộ Unit Tests repo PASS 100%. Bàn giao full pnpm check/build và nghiệm thu trình duyệt cho supervisor Codex.

## Quyết định và thay đổi

- **Hub Tra cứu ([web/src/app/hoc/tra-cuu/page.tsx](file:///E:/Projects/Japanese/web/src/app/hoc/tra-cuu/page.tsx)):**
  - Đưa thanh tìm kiếm nổi bật `SearchTrigger variant="bar"` lên đầu trang với placeholder *"Tìm từ, chữ, ngữ pháp…"*, vùng chạm ≥48px (`min-h-12`), phím tắt `Ctrl+K` trực quan.
  - Không tự focus bàn phím ảo trên mobile khi người dùng chỉ mở trang Hub, tránh làm phiền trải nghiệm đọc.
  - Tinh chỉnh 4 thẻ danh mục lớn (Bảng chữ Kana, Kanji, Động từ, Bảng tham chiếu) với mô tả ngắn gọn, icon nổi bật, vùng chạm ≥76px, hiệu ứng hover/active theo token Washi.
  - Giữ nguyên các URL tra cứu cũ: `/hoc/tra-cuu`, `/hoc/tra-cuu/kana`, `/hoc/tra-cuu/kanji`, `/hoc/tra-cuu/dong-tu`, `/hoc/tra-cuu/bang`.

- **Chỉ mục tìm kiếm & Nhóm kết quả Tính năng ([web/src/lib/search.ts](file:///E:/Projects/Japanese/web/src/lib/search.ts)):**
  - Thêm `SearchKind = 'feature'`, đưa `feature` lên đầu thứ tự nhóm cố định (`KIND_ORDER`: `feature` → `vocab` → `grammar` → `kanji` → `verb` → `table` → `lesson`).
  - Hàm `getFeatureEntries()`: Cung cấp danh sách 12 điểm đến tính năng cốt lõi của MaiPace (Tra cứu, Kana, Kanji, Động từ, Bảng tham chiếu, Thống kê, Học bài, Luyện tập, Ôn tập, Điểm yếu, Cài đặt, Audio CD) kèm alias tiếng Việt có dấu/không dấu và tiếng Anh.
  - Giới hạn nhóm tính năng `MAX_PER_GROUP.feature = 4` (các nhóm học liệu giữ nguyên 5) để các mục điều hướng không bao giờ chiếm hết giới hạn 20 kết quả, bảo toàn kết quả từ vựng/ngữ pháp/kanji khi tìm kiếm.
  - Bỏ qua khớp chuỗi con (substring contains - Tier 3) đối với nhóm tính năng khi từ khóa tìm kiếm < 2 ký tự (ví dụ: gõ `a`), tránh làm tràn kết quả bằng các tính năng không liên quan.
  - Tích hợp chuẩn hóa `đ/Đ` → `d` và xếp hạng 3 tầng: Khớp chính xác (Tier 1) > Khớp đầu chuỗi (Tier 2) > Khớp trong chuỗi (Tier 3).

- **Hộp tìm kiếm toàn cục ([web/src/components/search/SearchDialog.tsx](file:///E:/Projects/Japanese/web/src/components/search/SearchDialog.tsx), [web/src/components/search/SearchTrigger.tsx](file:///E:/Projects/Japanese/web/src/components/search/SearchTrigger.tsx)):**
  - Hỗ trợ nhóm hiển thị `TÍNH NĂNG` với nhãn chữ thông thường (không áp font tiếng Nhật `font-jp`/`lang="ja"` cho tên tiếng Việt) và badge màu chủ đạo Washi (`bg-primary/10 text-primary border-primary/30`).
  - Bổ sung chip gợi ý `tra cứu` cùng các từ vựng mẫu ở trạng thái chưa nhập (`SUGGESTIONS`).
  - Xử lý trạng thái lỗi tải chỉ mục (`hasIndexError`): Hiển thị thông báo thân thiện, nút "Thử lại", và lưới liên kết nhanh tới 6 danh mục chính để người dùng vẫn điều hướng được.
  - Nâng cấp `SearchTrigger` với prop `variant="bar"` bên cạnh chế độ `iconOnly` và button truyền thống, đảm bảo không ảnh hưởng tới các vị trí gọi hiện có trong app.
  - Bảo tồn toàn bộ hành vi bàn phím Base UI (ArrowDown/Up, Enter, Escape, bẫy Tab, hoàn trả focus khi đóng).

## Files và APIs tái sử dụng

- `SearchTrigger` ([web/src/components/search/SearchTrigger.tsx](file:///E:/Projects/Japanese/web/src/components/search/SearchTrigger.tsx))
- `SearchDialog` ([web/src/components/search/SearchDialog.tsx](file:///E:/Projects/Japanese/web/src/components/search/SearchDialog.tsx))
- `buildSearchIndex`, `executeSearch`, `getFeatureEntries` ([web/src/lib/search.ts](file:///E:/Projects/Japanese/web/src/lib/search.ts))
- `Furigana` ([web/src/components/Furigana.tsx](file:///E:/Projects/Japanese/web/src/components/Furigana.tsx))
- Theme tokens & Button variants (`@/components/ui/button`, `@/components/ThemeToggle`)

## Kiểm chứng (Evidence on hand)

- **Targeted Search Tests ([web/src/lib/search.test.ts](file:///E:/Projects/Japanese/web/src/lib/search.test.ts)):**
  - Chạy `node --test web/src/lib/search.test.ts`: **PASS 9/9 tests (100%)**
  - Đã kiểm tra:
    1. `normalizeSearchText` chuẩn hóa chữ thường, khoảng trắng, bỏ dấu và thay `đ/Đ` thành `d`.
    2. `buildSearchIndex` nạp đủ 7 nhóm dữ liệu tĩnh (kèm `feature`) với href chính xác.
    3. `executeSearch` tìm kiếm qua romaji, hiragana, kanji và tiếng Việt không dấu.
    4. `executeSearch` xử lý ca kiểm thử `đ -> d`: `dong tu` và `do an`.
    5. `executeSearch` ưu tiên xếp hạng chính xác > đầu chuỗi > chứa trong.
    6. `executeSearch` tuân thủ thứ tự nhóm cố định và giới hạn 5 mục/nhóm, tối đa 20 mục.
    7. `executeSearch` tìm động từ qua cả thể từ điển và thể masu.
    8. `executeSearch` trả về đích tính năng phù hợp cho `tra cuu`, `kana`, `kanji`, `dong tu`, `thong ke` (Tier 1) và không làm mất học liệu nội dung.
    9. `executeSearch` giới hạn nhóm tính năng tối đa 4 mục, không làm tụt học liệu.
- **Toàn bộ Unit Tests trong Repo:**
  - Chạy `pnpm --prefix web test`: **PASS 201/201 tests (100%)**, 0 fail, 0 error.

## Giới hạn và phần chưa kiểm chứng

- Theo phân công headless worker: Đã hoàn tất phạm vi code và unit tests được giao; chưa chạy full `pnpm check`, `pnpm build` và kiểm thử trình duyệt tương tác (Playwright/Browser subagent), bàn giao lại cho supervisor Codex thực hiện nghiệm thu toàn cục.
- Không sửa các file ngoài phạm vi (AppNav, DashboardContent, practice, review, profile, DESIGN.md, docs/specs/README.md).

## Bước tiếp theo

- Supervisor Codex chạy `pnpm check` và `pnpm build` tích hợp trên toàn repo.
- Thực hiện nghiệm thu giao diện trình duyệt (Mobile 390px, Desktop 1280px, phím tắt Ctrl+K, bộ đọc màn hình ARIA combobox).
