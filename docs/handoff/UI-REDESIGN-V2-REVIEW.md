# MaiPace — review UI/UX redesign v2

Ngày: **07/10/2026**. Reviewer: Codex. Nhánh: `ui-redesign-v2`, HEAD được review: `d77ebde8bb40eb6a3b3ea7b0c18d9dda2f64f5da`. Trạng thái: **chưa đạt nghiệm thu UI; cần sửa P0/P1**. Đây là review, không phải báo cáo đã sửa.

## Nhận định

Hướng Phố giấy đã rõ hơn, CTA dễ tìm và phần lớn màn bớt nhiễu. Tuy nhiên hình ảnh chưa được phối hợp với chữ có chủ đích: bong bóng che nhân vật, Chi tiết bài đọc chữ trên cảnh, còn lộ trình bị đóng khung. Luồng luyện tập có lỗi làm lộ đáp án và chưa giữ được hợp đồng không cuộn. Điểm tổng thể **6,5/10**; ưu tiên tính đáng tin của bài tập trước chỉnh trang trí.

| Màn | Điểm /10 | Vì sao |
| --- | ---: | --- |
| Bảng tin | 7 | Thứ tự ôn → nháp → bài rõ, nhưng thiếu số mục mới và bong bóng phá cảnh. |
| Học bài | 7,5 | Tuyến 25 bài dễ quét, desktop hai cột tốt; stage đóng khung và chữ Nhật ở dòng chưa nổi bật. |
| Chi tiết bài | 6 | Giữ nội dung/anchor, slip thấy ngay; chữ trên ảnh và mô tả dài làm hero thiếu sạch. |
| Câu hỏi luyện tập | 4 | Vùng đáp án dễ chạm; loa làm lộ cách đọc, mất nút pause, bố cục vẫn cho cuộn. |
| Kết quả | 6 | Luyện tập gọn hơn; retry dùng link giả và kết quả Ôn tập thật vẫn là UI cũ. Điểm chủ yếu từ code vì không có ảnh kết quả. |
| Ôn tập | 7 | Số liệu và preview rõ, giữ quota riêng; resume nhỏ và preview ép nghĩa thành dấu ba chấm. |
| Luyện tập | 6,5 | Một CTA chính đúng, tùy chỉnh thu gọn tốt; nháp/config thành hai khung cạnh tranh, thao tác xóa thiếu bảo vệ. |
| Tra cứu | 8 | Glyph Nhật tạo bản sắc, các đích rõ; mô tả bị cắt và có mâu thuẫn luật thẻ/dòng cần chốt. |

## Phạm vi và bằng chứng

- Đọc diff `master..ui-redesign-v2 -- web/ DESIGN.md`, plan, prompt từng màn, `PRODUCT.md`, `DESIGN.md`, SPEC-18 bản 2 và code liên quan. Áp dụng [web-design-guidelines](../../.agents/skills/web-design-guidelines/SKILL.md), lấy [checklist hiện hành](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) ngày review; quy ước repo thắng ví dụ chung.
- Đã mở **toàn bộ 41 PNG** trong `D:/Projects/Lab/ui-v2-shots/`: Home 8; Học 4; Chi tiết Bài 1 4; Tra cứu 4; Luyện tập 9; Ôn tập 8; session 4. Bộ ảnh gồm 390×844 và 1280×800, sáng/tối, due/draft; config/listening/wrong/unanswered theo tên file. `-draft` của Ôn tập chứa nháp **Luyện tập**, không phải bằng chứng màn resume nháp Ôn tập.
- Browser đọc trực tiếp `http://localhost:3100`: title **MaiPace — Tự học tiếng Nhật**; trang Home guest mới; `/hoc/1#ngu-phap` có target cách đỉnh viewport 95,75px, `#app-scroll-container.scrollTop = 4384`. Anchor ngữ pháp hoạt động trong lần mở trực tiếp này. Không sửa dữ liệu browser, không thực hiện đáp án hoặc tạo phiên.
- Chưa nghiệm thu: kết quả thật của cả hai luồng; correct frame; nháp Ôn tập; quota/blocked/error bằng browser; mọi deep link cụ thể; 320px/zoom 200%; bàn phím đủ năm dạng; reduced motion thực tế; offline/reconnect. Không chạy check/test/build vì chỉ thêm báo cáo, không thay code/config. Không lấy kết quả kiểm tra cũ làm bằng chứng hôm nay.
- Không tính cover thiếu ở Bài 16/17/18/21/23 là lỗi theo phạm vi giao việc. Nút Next DevTools xuất hiện trên ảnh là chrome phát triển, không tính là UI sản phẩm.

## Findings — ưu tiên theo màn

P0 = hỏng luồng/tính đáng tin hoặc chặn truy cập; P1 = tổn hại rõ UX/ý đồ; P2 = tinh chỉnh. “Code” là suy luận có đường thực thi cụ thể, chưa phải tái hiện browser. Mỗi mục dưới đây là một finding; tổng **28**.

### Câu hỏi luyện tập

1. **P0 — Loa cung cấp đáp án câu cách đọc.** `web/src/components/practice/PracticeRunner.tsx:498`. Ảnh `session-390-light-unanswered.png` ghi “Chọn cách đọc đúng của từ”, đề `社員`, nhưng loa đọc chính từ đó; điều kiện chỉ kiểm `containsJapanese`. Đây là lỗi mới, làm sai ý nghĩa luyện nhớ. **Sửa:** chỉ mở loa trước chấm cho dạng câu mà âm thanh không là đáp án; với câu cách đọc/kana, chuyển loa sang phần phản hồi sau `answered`. Dựa trên subtype/metadata của generator hoặc helper hiện có, không đoán bằng regex câu hướng dẫn trong component.

2. **P1 — Không còn cách vào trạng thái pause.** `web/src/components/practice/PracticeRunner.tsx:426`, `:457`. `togglePause` chỉ được gọi từ nút trong overlay khi `isPaused` đã true; top bar mới bỏ nút kích hoạt. Người học bị gián đoạn không thể tạm dừng đo thời gian như master. **Sửa:** trả nút ghost `size="quiz"`, `className="size-12 shrink-0"`, icon Pause + `aria-label="Tạm dừng phiên"`; số thời gian chỉ hiện từ `sm`. Giữ thanh progress co bằng `min-w-0 flex-1`.

3. **P1 — Hợp đồng không cuộn chưa được thực hiện.** `web/src/components/practice/PracticeRunner.tsx:454`. Vùng chính dùng `overflow-y-auto`; question có `min-h-[140px]`, đáp án và phản hồi đều `shrink-0`. Khi câu dài/furigana/ghép cặp/phản hồi dài vượt chiều cao, nút tiếp theo đi xuống vùng cuộn. Bốn ảnh session hiện tại vừa viewport không chứng minh các dạng khác. **Sửa:** dùng grid ba vùng `grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto_auto] overflow-hidden`, giảm khoảng trống/prompt qua biến thể theo dạng; giữ action footer ổn định. Kiểm tra câu dài và bàn phím ảo; nếu vẫn cần đọc nội dung dài, giới hạn vùng đọc thay vì cuộn cả đáp án/footer.

4. **P1 — Enter ở Sắp xếp có thể chấm khi đang định sửa hoặc thoát.** `web/src/components/practice/QuestionReorder.tsx:70`. Listener mới chỉ bỏ qua INPUT/TEXTAREA, nên khi đủ token, Enter trên token đã chọn, loa hoặc nút đóng sẽ `preventDefault()` và chấm luôn. **Sửa:** ưu tiên hành vi control đang focus: bỏ qua `button,a,input,textarea,select,[contenteditable]`, `event.defaultPrevented`, modal mở; Enter shortcut chỉ chạy khi focus ở vùng câu hỏi không tương tác. Giữ Enter native trên nút “Kiểm tra”.

5. **P1 — Đóng phiên chỉ có vùng chạm 40px.** `web/src/components/practice/PracticeRunner.tsx:430`. `size="icon"` + `size-10` thấp hơn 48px của hợp đồng luyện tập. **Sửa:** `size="quiz" className="size-12 shrink-0 px-0"`; giữ X ở `size-5`, không cần phóng icon.

6. **P2 — Chữ Nhật trong phần giải thích thấp hơn chữ trạng thái.** `web/src/components/practice/PracticeRunner.tsx:575`. Ví dụ `text-base` 16px, “Chưa đúng” `text-lg` 18px; câu cần học thành yếu tố thứ cấp. **Sửa:** ví dụ `jp jp-example leading-loose`, trạng thái `text-base font-semibold`, nghĩa `text-sm`; giữ ba bậc Latin 12/14/16px khi có gợi ý.

### Kết quả

7. **P1 — Redesign kết quả Ôn tập chưa nối vào luồng thật.** `web/src/components/practice/SessionResult.tsx:33`, `web/src/components/review/ReviewRunner.tsx:397`, `web/src/app/on-tap/phien/page.tsx:144`. Route Ôn tập dùng ReviewRunner với JSX kết quả riêng: ba ô thống kê và các khung trạng thái cũ. Props `hasMoreDue/onContinueReview` mới trong SessionResult không có caller tại luồng này. Đây là khoảng trống triển khai, không khẳng định logic FSRS hỏng. **Sửa:** áp bố cục vignette + câu “Đã ôn N mục” + dòng lịch + một CTA “Ôn lô tiếp” vào renderer thực, tái sử dụng SessionResult nếu truyền đủ trạng thái next batch/loading/blocked/quota; giữ kế hoạch lô đã tính trong ReviewRunner.

8. **P1 — Làm lại câu sai là link giả có hai hành vi điều hướng.** `web/src/components/practice/SessionResult.tsx:239`. `href="#"` đồng thời `onClick` ghi nháp và `pushState/router.push` resume; Link vẫn có navigation mặc định, Ctrl/middle-click chỉ mở hash. Chưa tái hiện race ở browser. **Sửa:** một `<button type="button" onClick={handleRetryIncorrect}>` trông như dòng `flex min-h-14 w-full items-center gap-3 border-b border-border py-3 text-left focus-visible:ring-3 focus-visible:ring-ring`; không dùng href giả hoặc buộc LinkRow chịu hành động.

9. **P1 — “Luyện tiếp” thu hẹp phiên nhiều bài thành bài đầu.** `web/src/components/practice/SessionResult.tsx:154`. CTA mới điều hướng `?lessons=${primaryLesson}`; phiên Bài 1+2+3 trở thành Bài 1 mặc dù config/preset trước đó có nhiều bài. Caption `lessonsLabel` cũng chỉ nêu bài đầu (`:88`). **Sửa:** truyền toàn bộ danh sách bài theo query parser hiện có, hoặc về `/luyen-tap` để dùng preset đã lưu; caption “Bài 1, 2, 3”/“3 bài” tương ứng. Đây là thay đổi hành vi so với nút cũ về `/luyen-tap`.

10. **P2 — Câu cần xem lại và các đích phụ lại đóng khung.** `web/src/components/practice/SessionResult.tsx:193`, `:237`. Hai khung `rounded-xl border bg-card` khiến màn lặp vật liệu slip. **Sửa:** danh sách `divide-y divide-border`, từng mục `py-4`; điều hướng `divide-y divide-border border-b border-border`. Đổi lời khen ở `:184` thành dòng icon + “Đúng tất cả N câu”, bỏ khung và đoạn dài.

11. **P2 — Retry lỗi lưu dưới chuẩn vùng chạm.** `web/src/components/practice/SessionResult.tsx:174`. `size="sm"` nằm trong luồng luyện tập; trạng thái lỗi là lúc nút cần dễ bấm nhất. **Sửa:** `size="quiz" variant="outline" className="w-full text-destructive"`. ReviewRunner `:436` có cùng nợ cũ, sửa cùng đợt áp kết quả mới.

### Bảng tin

12. **P1 — Slip không mô tả đầy đủ khối lượng ôn.** `web/src/components/DashboardContent.tsx:215`. Ảnh Home ghi 10 đến hạn, Ôn tập ghi thêm 10 mới; khi chỉ có mục mới, dòng chính có thể chỉ còn thời gian hoặc rỗng. **Sửa:** dùng `queue.newTargetIds.length` và câu “10 mục đến hạn · 10 mục mới”, bỏ phần bằng 0 phù hợp; đưa thời gian sang một dòng `text-sm text-muted-foreground`. Cùng một batch phải cùng số liệu hai màn.

13. **P1 — Bong bóng che hết đầu nhân vật.** `web/src/components/DashboardContent.tsx:176`. Cả 390 và 1280, sáng/tối đều thấy; đuôi cố định `left-8` chỉ xuống cửa hàng, không tới người nói. Cảnh thành nền nhiễu sau một hộp chữ. **Sửa:** đặt theo vùng trống/sidecar của từng scene như SPEC-18; thiếu dữ liệu vị trí thì đưa câu xuống dưới cảnh trong normal flow, không ép mọi cảnh cùng tọa độ. Có thể tăng scene mobile tới `h-64` sau khi đo slip vẫn nằm trên dock; tăng chiều cao một mình không giải quyết điểm che đầu.

14. **P1 — Hứa lịch ngày mai khi không có mục.** `web/src/components/DashboardContent.tsx:342`. Nhánh `dueTomorrowCount === 0` vẫn ghi “lượt tiếp theo ngày mai”, mâu thuẫn Ôn tập. **Sửa:** “Hôm nay đã ôn xong · ngày mai chưa có mục nào”; nếu biết hạn kế tiếp thật thì nêu ngày đó. Không suy hết đến hạn = đã thực hiện ôn hôm nay khi chưa có lịch sử; tên trạng thái có thể dùng “Không có mục đến hạn” cho trường hợp đó.

15. **P2 — Slip mobile chỉ lấn cảnh 8px.** `web/src/components/DashboardContent.tsx:164`, `web/src/components/PaperStage.tsx:46`. Grid `gap-6` cộng `-mt-8` chỉ còn overlap 8px, trong khi hợp đồng 32px; hai khối giống nối mép hơn lớp giấy. **Sửa:** `gap-y-0 xl:gap-8` ở grid và giữ khoảng giữa hàng phụ ở cột phải; PaperSlip vẫn `-mt-8 xl:mt-0`. Đo lại long sentence ở 390×844.

16. **P2 — Hai thanh tiến độ tự dựng.** `web/src/components/DashboardContent.tsx:261`, `:310`. Có aria value nhưng thiếu tên phân biệt, và lặp transform/transition khác Progress/LessonProgress. **Sửa:** tái sử dụng Progress hiện có, thêm tên “Tiến độ từ vựng Bài N”; giữ `aria-valuetext` nói đây là từ vào lịch ôn. Không tạo helper progress thứ ba.

### Chi tiết bài

17. **P1 — Chữ chức năng đọc trên cảnh có quá nhiều chi tiết.** `web/src/app/hoc/[so]/page.tsx:57`. Ảnh sáng/tối đều cho thấy chữ mô tả hòa vào quần áo/cửa hàng; gradient phủ tối không tạo nền ổn định. Back link còn `backdrop-blur-xs`, stage `sm:rounded-2xl overflow-hidden`. **Sửa:** cảnh `.paper-scene` không khung; Back ở normal flow `min-h-12`; tiêu đề Nhật + Việt dưới ảnh trên nền `bg-background`, nối slip bằng một bố cục chủ đích. Bỏ gradient, blur và radius stage; giữ slip là khung duy nhất của hero.

18. **P1 — Ví dụ/ngữ pháp không giữ ưu tiên chữ Nhật trên mobile.** `web/src/app/hoc/[so]/page.tsx:242`, `:279`. Pattern/example 16px bằng nghĩa Việt 14–16px và thấp hơn nhiều heading; desktop mới tăng example 20px. **Sửa:** pattern `jp jp-example font-medium text-foreground leading-loose`, example `jp jp-example`; nghĩa `text-sm`. Khối trích `rounded-lg bg-muted p-4`; bỏ `text-primary` cho toàn mẫu để dành son cho hành động/điểm nhấn.

19. **P2 — Hero và shortcut nói quá nhiều.** `web/src/app/hoc/[so]/page.tsx:81`, `:133`. Mô tả hai dòng kể lại nội dung; shortcut Ngữ pháp ở 390 cũng thành ba dòng do detail dài. **Sửa:** bỏ mô tả khỏi hero, chuyển mô tả vào phần tham khảo nếu cần; shortcut chỉ “Ngữ pháp · 6 mẫu”, “Luyện nghe”, “Xem toàn bộ bài · 41 từ”, không `detail` thừa. Dùng chung header cho có/không cover để không lệch copy/size.

### Học bài

20. **P1 — Stage là ảnh thẻ thay vì cảnh tràn vào giấy.** `web/src/components/LessonGrid.tsx:201`. `rounded-xl` ở ảnh và wrapper `overflow-hidden` tạo khung rõ ở cả hai theme. **Sửa:** bỏ hai radius/overflow này; giữ `paper-scene` và cho `-mx-4 sm:mx-0` nếu cần tràn mobile. Slip mới mang border/radius; thumbnail 64px được giữ bo góc.

21. **P1 — Dòng lộ trình cho chữ Việt đậm hơn chữ Nhật.** `web/src/components/LessonGrid.tsx:312`. Ảnh desktop: tiêu đề Việt bold, Nhật phía dưới nhỏ/nhạt; nhìn như catalog tiếng Việt dù Nhật phải là trung tâm khối. **Sửa:** Nhật `jp jp-example font-medium text-foreground`, Việt `text-sm font-normal text-muted-foreground`; “Bài N” và status `text-xs`. Cảnh thumbnail làm mốc, không cần đường bo quanh từng hàng.

22. **P2 — Filter có tên truy cập nhưng nút xóa quá nhỏ.** `web/src/components/LessonGrid.tsx:182`. Icon nhỏ + `p-1` khó thao tác ngón tay, input h-10 cũng thiếu nhịp với CTA 48px. **Sửa:** input `h-12 pr-12`, clear button `size-12 inline-flex items-center justify-center right-0`; label hiển thị “Lọc bài học” thay vì chỉ placeholder khi đã nhập.

### Luyện tập — cấu hình

23. **P1 — Bỏ nháp xóa ngay, không có hoàn tác.** `web/src/app/luyen-tap/page.tsx:396`. Nút mới gọi `clearPracticeDraft()` trực tiếp; người dùng có thể mất phiên chỉ vì chạm nhầm, nhất là hai nút full-width sát nhau ở mobile. **Sửa:** dialog xác nhận nêu “Xóa tiến độ câu 2/15?” với action destructive, hoặc toast có Undo nếu giữ snapshot nháp. Tiếp tục vẫn là CTA chính; Bỏ nháp chuyển thành action phụ nhỏ về thị giác nhưng vùng chạm 48px.

24. **P1 — Radio số câu không có bàn phím radio.** `web/src/app/luyen-tap/page.tsx:607`. Bốn button `role="radio"` đều Tab tới, thiếu roving tabindex/Arrow/Home/End. Screen reader được hứa radiogroup nhưng hành vi chỉ là button. **Sửa:** native `<input type="radio" name="question-count">` + label 48px, hoặc RadioGroup Base UI đang dùng trong repo; giữ selected theo token và focus rõ.

25. **P1 — Nháp và cấu hình cạnh tranh bằng hai slip.** `web/src/app/luyen-tap/page.tsx:413`, `:452`, `:497`. Ảnh draft cho thấy hai khung lớn và khung details; desktop config còn 30/24/14/12px Latin, vượt ba bậc. **Sửa:** khi có nháp, một slip nhỏ với “Phiên dở · Bài 1 · câu 2/15” + nút tiếp tục; cấu hình phiên mới thành vùng giấy thường `border-t border-border py-4`, heading `text-base`, secondary Start; summary tùy chỉnh thành dòng hairline không khung. Giữ scale Latin 24/14/12px.

26. **P2 — Controls tùy chỉnh dưới chuẩn 48px.** `web/src/app/luyen-tap/page.tsx:516`, `:545`, `:582`, `:621`. All/clear h-8, chips min-h-11. **Sửa:** `size="quiz"` cho button, `min-h-12` cho chips/radio; ghost all/clear `text-xs` vẫn có vùng chạm rộng. Không dùng đổi cỡ chữ để bù vùng chạm.

### Ôn tập

27. **P1 — Resume nháp Ôn còn banner khung và nút rất nhỏ.** `web/src/app/on-tap/page.tsx:226`, `:238`. Nháp Ôn dùng `size="sm"` cho tiếp tục/bỏ, khác nháp Luyện dùng quiz; ảnh `on-tap-*-draft` chưa phủ case này vì nháp seed là Luyện. **Sửa:** ưu tiên slip nháp với button quiz 48px và câu có số; nút phiên mới secondary (logic `resolveReviewStartAction` hiện đã đúng). Action “Bỏ qua” cần ghi đúng nghĩa “Bỏ nháp”; dùng xác nhận/Undo nếu xóa nháp.

28. **P2 — Preview/củng cố cắt phần người học cần đọc.** `web/src/app/on-tap/page.tsx:537`, `web/src/components/DashboardReinforcement.tsx:68`. Ảnh 390 “bé (hậu tố thân mật gọi t…” không thể mở rộng vì preview không bấm; ở củng cố, “sai N lần” nối cuối cùng chuỗi truncate nên có thể bị mất. **Sửa:** nghĩa preview `line-clamp-2`; badge chuyển xuống dòng riêng ở mobile bằng `flex-col items-start sm:flex-row sm:items-center`, hoặc để badge cạnh nhãn thay vì tranh chiều ngang. Củng cố tách “sai N lần” thành `shrink-0 text-xs`, giữ nghĩa `min-w-0`. Dùng `late` để nhãn “Quá hạn N ngày” khi cần đúng hợp đồng badge toàn cục.

### Tra cứu và tính nhất quán toàn cục

Tra cứu không có lỗi chức năng đã xác nhận; bốn URL vẫn đúng, search dùng SearchTrigger, heading và focus hiện diện, glyph Nhật là lớn nhất. Mô tả Kana đang `line-clamp-1` tại `web/src/app/hoc/tra-cuu/page.tsx:90`: tinh chỉnh khi sửa mục 28 bằng `line-clamp-2` hoặc copy “Bảng chữ và cách viết”. Không thêm finding riêng để tránh chia nhỏ cùng vấn đề cắt nội dung.

Prompt §7 yêu cầu tiles 2×2, trong khi DESIGN mới nói mọi khối phụ là dòng link. **Không chấm lưới tiles là lỗi triển khai**, vì nó làm đúng brief cụ thể; coordinator cần ghi ngoại lệ Tra cứu có chủ đích vào DESIGN hoặc đổi brief thành bốn LinkRow với glyph `jp text-4xl` ở trái. Tương tự Ôn tập due và Luyện tập cấu hình được brief cho phép slip không có scene; không ép thêm ảnh để “đủ stage”.

Không thấy màu hex/raw palette mới trong các component UI đã review; status chính có icon + label. Native Furigana và helper Japanese được tái sử dụng, không phát hiện parser mới. Các animation vào màn/feedback có `motion-safe`, reorder có `MotionConfig reducedMotion="user"`; chưa kiểm runtime reduced motion, không chứng nhận toàn bộ motion đạt. PaperSlip là default surface nên bỏ `shadow-xs` cục bộ ở Home bubble và `_parts.tsx:40` trong đợt polish; không cần thêm abstraction.

## Đối chiếu từng ghi chú coordinator

| Ghi chú | Kết luận sau đối chiếu |
| --- | --- |
| A1 | Đồng ý, finding 12 P1; chỉ mới cần thiết kế state “only new” bằng browser. |
| A2 | Đồng ý, finding 14 P1. |
| A3 | Đồng ý, finding 16 P2, thêm tên progress truy cập. |
| B1 | Đồng ý, finding 20 P1. |
| B2 | Không đưa thành lỗi: đã được loại khỏi phạm vi; fallback không cản review. |
| E1 | Đồng ý, finding 2 P1; overlay có nút resume nhưng không có trigger pause. |
| E2 | Giữ là bằng chứng coordinator ngày 07/10, không tự nhận đã chạy lại; Enter một lần ở Next không phủ token Sắp xếp/modal. |
| E3 | Đồng ý và nâng P1 ở finding 8 vì semantics và navigation kép; chưa tái hiện race. |
| E4 | Đồng ý, finding 10 P2. |
| D1 | Đồng ý có lệch fallback ở `on-tap/page.tsx:131` so với `DashboardContent.tsx:63`; có thể dùng cùng 15 giây hoặc cùng ẩn khi thiếu lịch sử. Mức P2, ghép vào việc thống nhất khối ôn của finding 12, không tạo finding thứ 29. |
| D2 | Đồng ý phần khung lồng dư (`on-tap/page.tsx:395`); code có blocked/quota riêng, chưa có ảnh các trạng thái. Giữ P2 polish; ưu tiên icon + câu lỗi + đường đi cụ thể, không bỏ alert chỉ vì luật rows. |
| C1 | Đồng ý biểu hiện và sửa ở finding 17; DESIGN cấm blur card/phone và yêu cầu stage không khung. “Cấm gradients” còn được nêu trong prompt gộp; không gán nhầm nguyên văn đó cho DESIGN. |
| C2 | Đồng ý, finding 19 P2; copy hero dài, hai nhánh header trùng. |
| F1 | **Không đồng ý với snapshot hiện tại**: `luyen-tap/page.tsx:392` có `clearNewSessionRequest()` trước `router.push(draftInfo.resumeHref)`. Không báo regression resume chưa tồn tại. |
| H1 | Đồng ý che đầu nhân vật ở cả bộ seeded và Home guest đọc trực tiếp; finding 13 P1. Khoảng trống dưới Home guest tự nó không là lỗi: brief chỉ yêu cầu stage + một CTA. |
| E5 | Đồng ý, finding 1 P0; ảnh unanswered đủ xác nhận điều kiện loa sai. |

## Bước tiếp theo

Sửa finding 1 trước, sau đó 2–5/7–9/12–14/17–18/20–21/23–25/27. Coordinator cần nghiệm thu lại năm dạng bài, pause, retry sai, tiếp tục phiên nhiều bài, kết quả Ôn thật, nháp hai loại, only-new/quota/blocked và lỗi ảnh. Chụp thêm correct/result/config mở ở 390 và kết quả ở 1280, cả hai theme; thử keyboard, reduced motion và mất mạng trong tab đã mở trước khi kết luận sẵn sàng merge.
