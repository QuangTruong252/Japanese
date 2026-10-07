# MaiPace — hướng dẫn dùng chung cho coding agents

App cá nhân tự học Minna no Nihongo N5/N4, ưu tiên nội dung đáng tin,
offline-first và đồng bộ tiến độ đa thiết bị. Đây là định hướng; trạng thái triển khai
nằm trong `docs/specs/README.md`. Trả lời người dùng bằng tiếng Việt.

## Bắt đầu và phối hợp

- Codex, Claude Code và Antigravity dùng cùng quy ước này, làm việc luân phiên.
  Đầu phiên đọc `PRODUCT.md`, mục trạng thái trong `docs/specs/README.md`, rồi chỉ
  đọc spec/handoff liên quan. Kiểm tra Git root, status và code thật trước khi sửa.
- `PRODUCT.md` chốt MaiPace, thông điệp và cách dùng logo; Washi là hệ thiết kế.
  Spec mô tả hành vi mong muốn; code thể hiện hiện trạng; kết quả kiểm tra có ngày
  và phạm vi mới là bằng chứng đã kiểm chứng. Không suy từ có spec thành đã xong.
- Khi người dùng yêu cầu thực hiện, tự quyết chi tiết kỹ thuật trong phạm vi đã
  giao. Tìm thông tin trong repo trước khi hỏi; chỉ hỏi khi còn lựa chọn ảnh hưởng
  mục tiêu sản phẩm, dữ liệu hoặc phạm vi. Không hỏi lại việc đã được cho phép.
- Yêu cầu review/phân tích là chỉ đọc. Không tự commit/push, giao agent khác,
  thay kiến trúc hoặc mở rộng phạm vi; chỉ làm khi người dùng yêu cầu tương ứng.
- Báo tiến độ ngắn, nêu phát hiện và việc tiếp theo. Khi xong, nêu thay đổi,
  kiểm tra thực chạy và giới hạn; không gọi typecheck là nghiệm thu trình duyệt.
- Với thay đổi đáng kể, cập nhật trạng thái spec và handoff liên quan: ngày,
  quyết định, file/API dùng lại, kiểm tra, phần chưa kiểm chứng và bước tiếp theo.
  Dùng mẫu `docs/handoff/PROMPT-phien-moi.md`; hỏi đáp đơn thuần không tạo báo cáo.
  Không đánh dấu hoàn tất tính năng chỉ vì vừa sửa tài liệu về tính năng đó.

## Phạm vi và nguồn sự thật

- Code nằm trong `web/`: Next.js 16 App Router, React 19, TypeScript, pnpm.
- Đọc `docs/project-design-spec.md` cho kiến trúc và 5 dạng bài tập;
  thiết kế Washi theo thứ tự ở mục "Nguồn sự thật thiết kế" bên dưới.
- `web/package.json`, lockfile và code xác định phiên bản/API đang dùng.
  Nếu đặc tả mâu thuẫn với code, báo rõ; không tự đổi kiến trúc sản phẩm.
- `repo-reference/noken/` chỉ để đọc. Giữ nguyên thay đổi không liên quan;
  không commit/push trừ khi người dùng yêu cầu.
- Đọc docs tương ứng trong `web/node_modules/next/dist/docs/` trước khi sửa
  code Next.js. Nếu có hướng dẫn lồng trong thư mục làm việc thì đọc thêm;
  giữ block do Next.js quản lý nếu tồn tại, không tự tạo block giả.
- Tái sử dụng helper, component và dependency hiện có. Không thêm framework,
  abstraction hay tối ưu hiệu năng nếu chưa có nhu cầu thực tế.

## Nguồn sự thật thiết kế

Đọc theo thứ tự này; mỗi loại kiến thức chỉ có một nguồn có thẩm quyền.

1. `PRODUCT.md` — mục tiêu, người dùng, phạm vi, nguyên tắc sản phẩm.
2. `DESIGN.md` — hợp đồng UX và thị giác toàn cục: ý nghĩa token, typography,
   khoảng cách, bề mặt, chuyển động, responsive, điều hướng, pattern component
   và bảng ánh xạ pattern sang file code.
3. `web/src/app/globals.css` — giá trị token lúc chạy. Giá trị thô ở đây; ý nghĩa
   sử dụng ở `DESIGN.md`. Không chép giá trị sang tài liệu khác.
4. `docs/specs/SPEC-xx.md` — yêu cầu và bố cục từng màn, prompt Stitch ở §10.
5. `docs/handoff/SPEC-xx.md` — bằng chứng nghiệm thu có ngày.

- `docs/design-system.md` là **hướng dẫn đọc bằng tiếng Việt**, không phải nguồn
  token hay nguồn luật. Không lấy giá trị thiết kế từ file này.
- Luật toàn cục ở `DESIGN.md`, quyết định riêng từng màn ở SPEC. SPEC không được
  âm thầm nói ngược `DESIGN.md`; nếu cần đổi luật toàn cục thì sửa `DESIGN.md`
  có chủ đích trong cùng thay đổi và nói rõ.
- Phần YAML đầu `DESIGN.md` là bản máy đọc được cho công cụ AI. Khi nó lệch với
  `globals.css` thì stylesheet đúng. Không dùng export của Stitch ghi đè stylesheet.

## Dữ liệu, sync và ôn tập

- Dexie (`web/src/lib/db.ts`) là nguồn sự thật cho dữ liệu lưu phía client;
  Supabase phục vụ auth/sync. Không đọc Supabase trực tiếp trong render path.
- Đọc dữ liệu Dexie qua `useLiveQuery`; Zustand chỉ giữ UI state tạm thời,
  không tạo thêm bản sao dữ liệu học bằng persist middleware.
- Khi triển khai ghi/sync: ghi dữ liệu học và `pendingSync` trong cùng một
  transaction. Chỉ xóa mục chờ khi server xác nhận; retry phải idempotent.
- Không gọi network hoặc giải nén ZIP trong transaction Dexie. Chuẩn bị dữ
  liệu trước rồi ghi atomically; migration/import lỗi phải giữ dữ liệu cũ.
- Giữ chính sách xung đột đã duyệt trong spec; không tự thêm CRDT hoặc merge
  lịch sử review. Test gửi trùng, mất mạng và reconnect khi thay sync.
- Ôn tập chỉ qua `web/src/lib/fsrs.ts` (`rateAnswer`, `applyReview`), không
  gọi `ts-fsrs` trực tiếp trong component. Đổi cách chấm rating cần test hồi quy.
- Kiểm tra dữ liệu tại biên import/API; giữ RLS theo user, không đưa secret
  hoặc service-role key vào client, log hay tài liệu.

## Tiếng Nhật và nội dung học

- Giữ notation `私[わたし]は 学生[がくせい]です`; dùng `japanese.ts` và component
  `Furigana` hiện có. Không tạo parser/regex hoặc bộ chuyển kana ở component.
- Chấm đáp án chỉ chuẩn hóa những khác biệt được phép; không biến đáp án
  sai nghĩa thành đúng. Thay parser/chấm điểm cần ví dụ đúng và sai trong test.
- App phục vụ cá nhân mức N5/N4: nội dung tự biên soạn hoặc do AI soạn được dùng
  trực tiếp, chấp nhận sai sót nhỏ; không bắt buộc đối chiếu sách hay ghi nguồn.
  Sửa lỗi khi phát hiện; không bịa số trang hoặc liên kết audio.
- Audio import phải kiểm tra manifest, hash và mapping track trước khi thay
  dữ liệu cũ. Xử lý thiếu audio, quota, eviction và import lại; duration không
  thay thế xác thực hash. Không đưa audio nguồn vào bundle/public/cloud sync.

## UI và accessibility

- Dùng shadcn `base-nova` với Base UI theo `web/components.json`, không lấy
  ví dụ Radix áp thẳng vào component hiện tại. Chạy CLI trong `web/`.
- Dùng token Washi (`bg-background`, `text-foreground`, `font-jp`, ...),
  không hardcode màu trong component. Giữ component/variant tùy chỉnh hiện có.
- Kiểm tra mobile, bàn phím, focus, furigana, reduced motion và các trạng thái
  loading/empty/error. Nút trong luồng làm bài dùng `size="quiz"` khi phù hợp.
- Trong `@theme inline`, không tạo tham chiếu font vòng về chính biến
  `--font-sans`; lỗi này có thể không được compiler phát hiện.

## Skills và MCP

- Skills dự án nằm ở `.agents/skills/`; nguồn và cách dùng trong
  `docs/agent-tooling.md`. Chỉ đọc skill liên quan đến nhiệm vụ.
- Sau khi clone/di chuyển repo hoặc đổi hệ điều hành, chạy `node scripts/setup.mjs`
  từ root để cài dependency, tạo liên kết skills và MCP config của máy hiện tại.
  Nguồn cấu hình MCP là script setup; không commit file cấu hình được sinh ra.
- `vercel-react-best-practices`: React/Next; `shadcn`: component;
  `web-design-guidelines`: review UI/accessibility.
  Plugin riêng của một agent không phải điều kiện bắt buộc cho agent khác.
  Nếu thiếu công cụ, dùng tài liệu chung và ghi rõ giới hạn. Quy ước riêng của repo
  được ưu tiên hơn ví dụ chung; không tự thêm SWR hoặc đổi design system.
- Lệnh shadcn dùng dependency đang cài: `pnpm exec shadcn ...` trong `web/`.
  Ưu tiên component hiện có, rồi registry chính thức `@shadcn`; registry ngoài
  chỉ dùng khi nhiệm vụ cần. Không chạy init/apply/overwrite để lấy context.
- Next DevTools chỉ dùng với dev server đúng project/port; kiểm tra project
  metadata trước khi dựa vào lỗi/log. Không kết luận runtime ổn chỉ từ typecheck.

## Kiểm tra hoàn thành (chạy trong `web/`)

- Chỉ dùng pnpm. Chạy `pnpm check` (TypeScript + ESLint) trước khi báo xong.
- Đổi logic: chạy `pnpm test` (node:test), thêm kiểm tra hồi quy nhỏ khi cần.
- Đổi build/config ứng dụng: chạy `pnpm build` khi phù hợp.
- Đổi luồng UI: kiểm tra browser. Luồng học cần chạy tiếp khi mất mạng trong
  trang đã mở (không có service worker nên không yêu cầu reload offline); sync cần kiểm tra reconnect/retry. Nêu rõ phần chưa kiểm chứng.
- Không cần test mới cho thay đổi chỉ là tài liệu/cấu hình agent.

<!-- REPOWISE_AGENTS:START — Do not edit below this line. Auto-generated by Repowise. -->
## Codebase Intelligence for Japanese (Repowise)

Indexed by [Repowise](https://repowise.dev). Last indexed: 2026-10-07 (commit 0d17705). Confidence: 100%.Scope: standard index · template content · full Git · 16 eligible file pages omitted. Missing or unavailable evidence is not a negative finding. Run `repowise update --full` to continue the model-backed upgrade (cost is previewed before generation).Machine-readable scope: `{"analysis": {"skipped": [], "unavailable": []}, "content_provenance": "template", "file_pages": {"configured_cap": null, "effective_cap": null, "eligible": 153, "generated": 137, "omitted": 16}, "git_commit_cap": 500, "git_history_coverage": {"complete_through_depth": 116, "deep_commits": 0, "deep_files": 0, "eligible_files": 179, "fallback_files": 179, "files_with_history": 179, "global_commits": 116, "per_file_limit": 500, "recent_files": 179, "retained_commits": 577, "unavailable_files": 0, "workers": 8}, "git_tier": "full", "provider": {"embedder": "mock", "model": null, "model_cost_possible": false, "name": null, "reused": false}, "run_mode": "standard", "search": {"full_text": "available", "next_command": "repowise reindex", "semantic": "unavailable"}, "upgrade": {"completed_stages": [], "next_stage": "generation", "retryable": true, "status": "pending"}, "version": 1}`

### How to work in this repo

- **Trust the index.** `verified: true` and `_meta.complete` mean the bytes were checked against the live tree, so never re-read them. Re-read only what `bounds: "approximate"` or `_meta.stale_warning` names. `confidence` rates the prose, not the evidence: on `low` read the `fallback_targets` or `best_guesses` the reply names, and run `repowise update` and ask again if `_meta.hint` says the index is behind HEAD. `index_behind: true` alone is informational.
- **A zero carries its basis.** An empty `callers`/`callees`/`used_by` comes with a `*_basis` saying how much of that language's calls the graph resolved, so read it before concluding nothing calls a symbol. `_meta.scope_hint` names the areas the answer did not touch.
- **Pre-edit, not instead-of-edit.** These tools decide *which* files to read and edit. Reading a file before you edit it is correct and expected.
- **Noisy commands** (tests, builds, `git log`/`diff`, searches, listings): prefer `repowise distill <cmd>`, the same command with its exit code preserved and errors-first output. A `[repowise#<ref>: N lines omitted]` marker is recoverable via `repowise expand <ref>` (add `-q <regex>` to filter); never re-run the command to see omitted output.
- **Recording a decision** you had to reason out: `repowise decision add --title T --decision D` records it without prompting and prints the id (`--format json` to parse it back). It lands `proposed`, for a person to confirm.

### Tools

| Tool | When and why |
|------|--------------|
| `get_answer(question)` | First call for any how/where/why question. Cite `confidence: "high"` or `grounding: "extracted"` directly; `degraded` means judge by `retrieval_quality`. `symbol_bodies` has live bodies. |
| `get_context(targets=[...])` | Triage card for files/modules/symbols: docs, signatures, hotspot, fix history. No source bytes — `include=["skeleton"]` for the whole file verified, `["callers"|"decisions"]` for depth. Batch targets. |
| `get_symbol(id, depth?)` | **Follow-up, not an entry point** — one verified body for an id a prior response named (`path.py::Name`, `path.py:140-180`, `repowise#<hex>`). Never walk a file symbol by symbol; Read it. |
| `search_codebase(query)` | Hybrid search, auto-routed by query shape; force with `mode=symbol|path|concept|hybrid`. A hit whose `sources` are `[fts]` only has no semantic agreement, so verify it. |
| `get_why(query, targets?)` | Why the code is shaped this way: decision records, git archaeology, rationale comments. Call before a refactor or a pattern divergence. |
| `get_risk(targets, changed_files?, include?)` | File history and structural reach. PR mode leads with `directive`; its 0-10 structural heuristic is uncalibrated, not a probability. Read typed test recommendations and coverage state first. |
| `get_change_risk(revspec?, extensions?, exclude_patterns?)` | Deterministic live-diff review signal for a commit or range. Lead with benchmarked percentile/classification; the 0-10 diff-shape score is supporting, not a probability. `get_risk` scores paths. |
| `get_health(targets?, include?)` | Defect / maintainability / performance scores and findings, plus documentation the code no longer supports. Self-check the files you touched before finishing. |
| `get_dead_code(tier?, min_confidence?, safe_only?)` | Confidence-tiered unreachable files / unused exports / zombie packages. For cleanup sweeps, not targeted fixes. |
| `get_overview()` | Architecture map. Call once, first, in an unfamiliar repo; skip it after that. |

### Architecture
**Files:** 969 | **Lines:** 165470
Japanese is a json codebase of 969 files. Execution starts at web/src/lib/supabase/server.ts. ---
*Built from the code's structure. It states what is there, not why it is that
way.

### Key modules
- `web/src` — web/src · web/src/data · web/src/hooks · web/src/types · web/src/workers
**Language:** typescript | **Files:** 6 | **Public symbols:** 54 /…
- `web/src/lib` — web/src/lib
**Language:** typescript | **Files:** 37 | **Public symbols:** 257 / 318
Covers the 37 source files in web/src/lib
- `web/src/components/ui` — web/src/components/ui
**Language:** typescript | **Files:** 15 | **Public symbols:** 77 / 80
Covers the 15 source files in…
- `web/src/components` — web/src/components · web/src/components/audio · web/src/components/lookup · web/src/components/practice · web/src/components/profile ·…
- `web/src/components/practice` — web/src/components/practice · web/src/components/review
**Language:** typescript | **Files:** 13 | **Public symbols:** 15 / 20
Covers the…
- `web/src/app/hoc` — web/src/app/hoc · web/src/app/hoc/[so] · web/src/app/hoc/[so]/tu-vung · web/src/app/hoc/tra-cuu · web/src/app/hoc/tra-cuu/bang ·…
- `web` — web · web/scripts · web/scripts/data-dicts
**Language:** javascript | **Files:** 11 | **Public symbols:** 10 / 28
Covers the 11 source…
- `web/src/app` — web/src/app · web/src/app/auth/callback · web/src/app/ca-nhan · web/src/app/ca-nhan/thong-ke · web/src/app/cai-dat ·…
- `.agents/skills/impeccable/scripts` — .agents/skills/impeccable/scripts
**Language:** javascript | **Files:** 5 | **Public symbols:** 0 / 644
Covers the 5 source files in…
- `scripts` — scripts
**Language:** javascript | **Files:** 4 | **Public symbols:** 11 / 35
Covers the 4 source files in scripts

### Entry points
- `web/src/lib/supabase/server.ts`

### Files that need care (bug-fix history first, then churn — check `get_risk` before editing)
- `web/src/components/DashboardContent.tsx` — 6 bug fixes, last fix 6 days ago (bug magnet); 15 commits/90d
- `web/src/components/practice/PracticeRunner.tsx` — 6 bug fixes, last fix 6 days ago (bug magnet); 17 commits/90d
- `web/src/app/on-tap/page.tsx` — 5 bug fixes, last fix 9 days ago (bug magnet); 13 commits/90d
- `web/src/components/practice/SessionResult.tsx` — 4 bug fixes, last fix 6 days ago (bug magnet); 12 commits/90d
- `web/src/app/hoc/[so]/page.tsx` — 4 bug fixes, last fix 9 days ago (bug magnet); 14 commits/90d

### Code health
Three co-equal signals: code health 7.15/10 avg (Good), hotspot health 4.25/10 (stable), worst `web/src/components/LessonGrid.tsx` at 1.1/10 · maintainability 6.5/10 · performance risk 77 open static I/O-in-loop / N+1 findings. Detail: `get_health()`.

Critical files:
- `web/src/lib/lookup.ts` — complex conditional (filterVerbs) — impact −2.5
- `web/src/components/practice/SessionResult.tsx` — untested hotspot — impact −2.0
- `web/src/components/search/SearchDialog.tsx` — untested hotspot — impact −2.0
- `web/src/components/lookup/VerbTable.tsx` — untested hotspot — impact −2.0
- `web/src/components/vocab/VocabLearningFlow.tsx` — untested hotspot — impact −2.0

<!-- REPOWISE_AGENTS:END -->
