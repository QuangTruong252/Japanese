# Ngôn ngữ thị giác v3 + Home — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa nền tảng "Sách sống" v3 (font, luật ngắt dòng tiếng Nhật, bộ thành phần giấy) vào app và dựng lại Home theo bố cục C2 đã duyệt, với nút chính luôn là bài học.

**Architecture:** Token font mới trong `globals.css`; một hàm thuần `groupFuriganaWords` cho luật ngắt dòng, `Furigana` dùng lại; luật CTA đơn giản hóa trong `dashboard-cta.ts`; `LessonSummary` thêm ảnh nhỏ cho phần bài; bộ thành phần mới `PaperKit.tsx` song song `PaperStage.tsx`; `DashboardContent.tsx` viết lại bằng các thành phần đó. Các màn khác không đổi bố cục.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4 (`@theme inline`), shadcn base-nova, Dexie + `dexie-react-hooks`, `node:test`, pnpm, `@fontsource`.

**Spec:** `docs/superpowers/specs/2026-10-08-maipace-visual-language-v3-design.md` (đọc cùng plan). Tham chiếu thị giác: `design-lab/home-v3.html`, khung "Bố cục C2", CSS `design-lab/lab-v3.css`.

## Global Constraints

- Chỉ dùng pnpm, chạy lệnh trong `web/`. Kiểm tra: `pnpm check`, `pnpm test`; `pnpm build` ở task cuối.
- Workers **không** chạy `pnpm dev`, `pnpm build`, `next`, không curl localhost; coordinator kiểm browser.
- Không sửa, khôi phục hay commit root `AGENTS.md`, `DESIGN.md`, `PRODUCT.md`, `CLAUDE.md` (đang rỗng có chủ đích), `.repowise/`, `.impeccable/`. `git add` chỉ đúng file của task, không `git add -A`.
- Màu chỉ qua token (`bg-card`, `text-muted-foreground`, `var(--background)`…); không hex trong component.
- Tiếng Nhật giữ notation `私[わたし]`; render qua `Furigana`; không regex/parser ở component.
- Không thêm dependency ngoài 3 gói font của Task 1.
- Chữ giao diện tối giản (spec §2.5): lời chào một dòng; không đoạn giải thích; nhãn ≤ 4 từ; dòng phụ chỉ khi có số liệu. Nghĩa tiếng Việt của câu Nhật được giữ.
- Chữ dài (spec §2.4): hàng nhãn + chữ dài phải `flex-wrap`, căn trái; không `truncate`/`line-clamp` nội dung học.
- Không bịa tính năng: không chuông, viết tay, camera, giọng nói, quét, "Ôn nhanh 5 phút", "Hội thoại".
- Commit chỉ khi người dùng đã cho phép commit trong phiên thực thi; nếu chưa, bỏ qua bước commit và để coordinator gom.

## File map

| File | Trách nhiệm | Task |
|---|---|---|
| `web/package.json`, `web/pnpm-lock.yaml` | 3 gói font mới, bỏ Inter | 1 |
| `web/src/app/globals.css` | import font, token `--font-sans/--font-heading/--font-serif/--font-jp-display`, `.jp-display` | 1 |
| `web/src/lib/japanese.ts` (+ test) | `groupFuriganaWords` | 2 |
| `web/src/components/Furigana.tsx` | render theo cụm không ngắt | 2 |
| `web/src/lib/dashboard-cta.ts` (+ test) | CTA luôn là bài học, `reviewHref` | 3 |
| `web/src/lib/lessons.ts` (+ test) | `vocabThumb`, `grammarThumb` trong `LessonSummary` | 4 |
| `web/src/components/PaperKit.tsx` | `SoftScene`, `PaperCloud`, `TornCard`, `SectionHeader`, `ListRow`, `PartRow` | 5 |
| `web/src/app/globals.css` (khối cuối file) | `.soft-scene`, `.paper-cloud`, `.torn-card*` | 5 |
| `web/src/components/DashboardContent.tsx` | Home C2 | 6 |

Thứ tự: Task 1–4 độc lập (chạy song song được; Task 1 và 5 cùng sửa `globals.css` nên Task 5 chạy **sau** Task 1). Task 5 sau 1. Task 6 sau 2–5. Task 7 (coordinator) cuối.

---

### Task 1: Font và token chữ

**Files:**
- Modify: `web/package.json`, `web/pnpm-lock.yaml` (qua pnpm)
- Modify: `web/src/app/globals.css:1-18` (khối import + `@theme inline` phần font), và khối `.jp` (~dòng 190)

**Interfaces:**
- Produces: utility Tailwind `font-sans` (Be Vietnam Pro), `font-heading`, `font-serif` (Noto Serif), biến `--font-jp-display`; class CSS `.jp-display` (dùng **kèm** `.jp`, ví dụ trên `Furigana`).

- [ ] **Step 1: Cài gói font, bỏ Inter**

```bash
cd web
pnpm add @fontsource-variable/noto-serif @fontsource/be-vietnam-pro @fontsource/shippori-mincho
pnpm remove @fontsource-variable/inter
```

- [ ] **Step 2: Xác nhận tên font-family thật trong gói**

```bash
grep -h "font-family" node_modules/@fontsource-variable/noto-serif/index.css | sort -u
grep -h "font-family" node_modules/@fontsource/be-vietnam-pro/400.css | sort -u
grep -h "font-family" node_modules/@fontsource/shippori-mincho/500.css | sort -u
```
Expected: `'Noto Serif Variable'`, `'Be Vietnam Pro'`, `'Shippori Mincho'`. Nếu khác, dùng đúng tên in ra ở Step 3.

- [ ] **Step 3: Sửa đầu `globals.css`**

Thay dòng `@import "@fontsource-variable/inter";` bằng:

```css
@import "@fontsource-variable/noto-serif";
@import "@fontsource/be-vietnam-pro/400.css";
@import "@fontsource/be-vietnam-pro/500.css";
@import "@fontsource/be-vietnam-pro/600.css";
@import "@fontsource/be-vietnam-pro/700.css";
@import "@fontsource/shippori-mincho/500.css";
@import "@fontsource/shippori-mincho/700.css";
```

Trong `@theme inline`, thay `--font-sans` và `--font-heading`, thêm 2 dòng (giữ nguyên comment chống tham chiếu vòng và `--font-jp`, `--font-mono`):

```css
  --font-sans: 'Be Vietnam Pro', ui-sans-serif, system-ui, sans-serif;
  --font-heading: 'Be Vietnam Pro', ui-sans-serif, system-ui, sans-serif;
  /* v3: chữ hiển thị (lời chào, tiêu đề lớn). Utility `font-serif` đang dùng ở nhiều màn. */
  --font-serif: 'Noto Serif Variable', ui-serif, Georgia, serif;
  /* v3: câu tiếng Nhật hiển thị lớn (Mincho). Chữ Nhật cỡ nhỏ vẫn dùng --font-jp. */
  --font-jp-display: 'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif;
```

- [ ] **Step 4: Thêm `.jp-display` ngay sau khối `.jp { … }`**

`.jp` là CSS ngoài layer nên thắng utility Tailwind; vì vậy dùng class thường đặt sau nó:

```css
/* v3: câu tiếng Nhật hiển thị lớn dùng Mincho. Luôn đi kèm `jp`. */
.jp-display {
  font-family: var(--font-jp-display);
}
```

- [ ] **Step 5: Kiểm tra**

Run: `pnpm check` — Expected: PASS (không lỗi TS/ESLint).
Run: `grep -rn "fontsource-variable/inter" src` — Expected: không còn kết quả.

- [ ] **Step 6: Commit**

```bash
git add web/package.json web/pnpm-lock.yaml web/src/app/globals.css
git commit -m "feat(ui-v3): Be Vietnam Pro, Noto Serif and Shippori Mincho font tokens"
```

---

### Task 2: Tiếng Nhật chỉ xuống dòng tại dấu cách của dữ liệu

**Files:**
- Modify: `web/src/lib/japanese.ts` (thêm hàm sau `parseFurigana`)
- Test: `web/src/lib/japanese.test.ts`
- Modify: `web/src/components/Furigana.tsx`

**Interfaces:**
- Consumes: `parseFurigana(text: string): FuriganaSegment[]`, `interface FuriganaSegment { base: string; ruby?: string }` (đã export ở `japanese.ts:3`).
- Produces: `export function groupFuriganaWords(text: string): FuriganaSegment[][]`. `Furigana` giữ nguyên props `{ text; className?; zoomable? }`.

- [ ] **Step 1: Viết test hỏng** — thêm `groupFuriganaWords` vào import đầu `japanese.test.ts`, rồi thêm:

```ts
test('groupFuriganaWords gom segment theo dấu cách của dữ liệu (luật ngắt dòng v3)', () => {
  assert.deepEqual(groupFuriganaWords('電車[でんしゃ]で 会社[かいしゃ]へ 行[い]きます。'), [
    [{ base: '電車', ruby: 'でんしゃ' }, { base: 'で' }],
    [{ base: '会社', ruby: 'かいしゃ' }, { base: 'へ' }],
    [{ base: '行', ruby: 'い' }, { base: 'きます。' }],
  ]);
  // Sai trước đây: "行き / ます。" bị tách; nay 行[い]きます。 luôn là một cụm.
  assert.equal(groupFuriganaWords('行[い]きます。').length, 1);
  assert.deepEqual(groupFuriganaWords('食[た]べます'), [[{ base: '食', ruby: 'た' }, { base: 'べます' }]]);
  assert.deepEqual(groupFuriganaWords('  はい  そうです '), [[{ base: 'はい' }], [{ base: 'そうです' }]]);
  assert.deepEqual(groupFuriganaWords('わたし　は'), [[{ base: 'わたし' }], [{ base: 'は' }]]);
  assert.deepEqual(groupFuriganaWords(''), []);
});
```

- [ ] **Step 2: Chạy, xác nhận hỏng**

Run: `node --test src/lib/japanese.test.ts`
Expected: FAIL — `groupFuriganaWords` không được export.

- [ ] **Step 3: Cài đặt** — thêm vào `japanese.ts` ngay sau `parseFurigana`:

```ts
/**
 * Gom segment thành cụm theo dấu cách (thường hoặc toàn góc) có sẵn trong dữ liệu. Mỗi cụm
 * render không ngắt dòng, nên câu chỉ xuống dòng giữa các cụm (spec v3 §2.3).
 */
export function groupFuriganaWords(text: string): FuriganaSegment[][] {
  const words: FuriganaSegment[][] = [[]];
  for (const segment of parseFurigana(text)) {
    if (segment.ruby) {
      words[words.length - 1].push(segment);
      continue;
    }
    segment.base.split(/[ 　]+/).forEach((part, i) => {
      if (i > 0) words.push([]);
      if (part) words[words.length - 1].push({ base: part });
    });
  }
  return words.filter((word) => word.length > 0);
}
```

- [ ] **Step 4: Chạy, xác nhận đạt**

Run: `node --test src/lib/japanese.test.ts` — Expected: PASS toàn bộ file.

- [ ] **Step 5: Dùng trong `Furigana.tsx`** — thay toàn bộ file:

```tsx
'use client';

import React from 'react';
import { groupFuriganaWords } from '@/lib/japanese';

interface FuriganaProps {
  text: string;
  className?: string;
  zoomable?: boolean;
}

/**
 * Furigana bằng thẻ <ruby>/<rt> gốc. Mỗi cụm giữa hai dấu cách của dữ liệu là một khối
 * không ngắt dòng; khoảng cách giữa cụm thay cho dấu cách (spec v3 §2.3).
 */
export function Furigana({ text, className = '', zoomable = true }: FuriganaProps) {
  const words = groupFuriganaWords(text);

  return (
    <span className={`jp inline-flex flex-wrap items-baseline gap-x-[0.3em] ${className}`}>
      {words.map((word, w) => (
        <span key={w} className="whitespace-nowrap">
          {word.map((segment, index) => {
            if (!segment.ruby) {
              return <span key={index}>{segment.base}</span>;
            }

            const rubyContent = (
              <ruby className="ruby-align-center">
                {segment.base}
                <rt className="select-none font-medium">{segment.ruby}</rt>
              </ruby>
            );

            if (zoomable) {
              return (
                <span key={index} className="ruby-word">
                  {rubyContent}
                </span>
              );
            }

            return <React.Fragment key={index}>{rubyContent}</React.Fragment>;
          })}
        </span>
      ))}
    </span>
  );
}
```

- [ ] **Step 6: Kiểm tra** — `pnpm check` và `pnpm test`. Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add web/src/lib/japanese.ts web/src/lib/japanese.test.ts web/src/components/Furigana.tsx
git commit -m "feat(jp): wrap Japanese only at data spaces, keep each chunk unbroken"
```

---

### Task 3: Nút chính Home luôn là bài học

**Files:**
- Modify: `web/src/lib/dashboard-cta.ts` (viết lại)
- Test: `web/src/lib/dashboard-cta.test.ts` (viết lại)

**Interfaces:**
- Produces (thay hoàn toàn API cũ; chỉ `DashboardContent.tsx` dùng — Task 6 cập nhật):

```ts
export type DashboardCtaKind = 'start_first_lesson' | 'continue_lesson';
export interface DashboardCtaInput {
  isNewUser: boolean;
  activeLessonNum: number;
  activeLessonTitle?: string;
  /** Có nháp Luyện/Ôn (chung khóa lưu) — dòng ôn phải qua /on-tap để hộp xác nhận bảo vệ nháp. */
  hasPracticeDraft?: boolean;
}
export interface DashboardCtaDecision {
  kind: DashboardCtaKind;
  href: string;
  ctaText: string;
  heading: string;
  /** Đích của dòng "Ôn tập đến hạn" bên dưới thẻ. */
  reviewHref: '/on-tap' | '/on-tap/phien';
}
export function resolveDashboardCta(input: DashboardCtaInput): DashboardCtaDecision;
```

- [ ] **Step 1: Viết test hỏng** — thay toàn bộ `dashboard-cta.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDashboardCta } from './dashboard-cta.ts';

test('người mới: CTA là Bắt đầu Bài 1', () => {
  const r = resolveDashboardCta({ isNewUser: true, activeLessonNum: 1, activeLessonTitle: 'Giới thiệu bản thân' });
  assert.equal(r.kind, 'start_first_lesson');
  assert.equal(r.href, '/hoc/1');
  assert.equal(r.ctaText, 'Bắt đầu Bài 1');
  assert.equal(r.heading, 'Bắt đầu Bài 1: Giới thiệu bản thân');
});

test('người học quay lại: CTA là Tiếp tục Bài N (v3: ôn đến hạn không còn chiếm CTA)', () => {
  const r = resolveDashboardCta({ isNewUser: false, activeLessonNum: 4, activeLessonTitle: 'Thời gian, ngày tháng' });
  assert.equal(r.kind, 'continue_lesson');
  assert.equal(r.href, '/hoc/4');
  assert.equal(r.ctaText, 'Tiếp tục Bài 4');
  assert.equal(r.heading, 'Bài đang học: Bài 4 — Thời gian, ngày tháng');
  assert.equal('isPrimaryReview' in r, false);
});

test('dòng ôn đi qua /on-tap khi có nháp Luyện/Ôn, ngược lại vào thẳng phiên', () => {
  assert.equal(resolveDashboardCta({ isNewUser: false, activeLessonNum: 2, hasPracticeDraft: true }).reviewHref, '/on-tap');
  assert.equal(resolveDashboardCta({ isNewUser: false, activeLessonNum: 2 }).reviewHref, '/on-tap/phien');
});

test('số bài biên (âm, NaN) kẹp về 1', () => {
  assert.equal(resolveDashboardCta({ isNewUser: false, activeLessonNum: -2 }).href, '/hoc/1');
  assert.equal(resolveDashboardCta({ isNewUser: false, activeLessonNum: Number.NaN }).ctaText, 'Tiếp tục Bài 1');
});
```

- [ ] **Step 2: Chạy, xác nhận hỏng**

Run: `node --test src/lib/dashboard-cta.test.ts`
Expected: FAIL (thiếu `reviewHref`, còn `isPrimaryReview`).

- [ ] **Step 3: Cài đặt** — thay toàn bộ `dashboard-cta.ts`:

```ts
/**
 * CTA chính của Bảng tin (v3, 08/10/2026 — docs/superpowers/specs/2026-10-08-maipace-visual-language-v3-design.md §4.1).
 *
 * Nút chính luôn là hành động bài học: người mới "Bắt đầu Bài 1", còn lại "Tiếp tục Bài N".
 * Mục đến hạn và phiên dở là các dòng phụ dưới thẻ; dòng ôn đi qua /on-tap khi đang có nháp
 * Luyện/Ôn để hộp xác nhận ở đó bảo vệ nháp (hai loại dùng chung khóa).
 */

export type DashboardCtaKind = 'start_first_lesson' | 'continue_lesson';

export interface DashboardCtaInput {
  isNewUser: boolean;
  activeLessonNum: number;
  activeLessonTitle?: string;
  /** Có nháp Luyện/Ôn (chung khóa lưu) — dòng ôn phải qua /on-tap để hộp xác nhận bảo vệ nháp. */
  hasPracticeDraft?: boolean;
}

export interface DashboardCtaDecision {
  kind: DashboardCtaKind;
  href: string;
  ctaText: string;
  heading: string;
  /** Đích của dòng "Ôn tập đến hạn" bên dưới thẻ. */
  reviewHref: '/on-tap' | '/on-tap/phien';
}

export function resolveDashboardCta({
  isNewUser,
  activeLessonNum,
  activeLessonTitle,
  hasPracticeDraft = false,
}: DashboardCtaInput): DashboardCtaDecision {
  const reviewHref = hasPracticeDraft ? '/on-tap' : '/on-tap/phien';

  if (isNewUser) {
    return {
      kind: 'start_first_lesson',
      href: '/hoc/1',
      ctaText: 'Bắt đầu Bài 1',
      heading: `Bắt đầu Bài 1${activeLessonTitle ? `: ${activeLessonTitle}` : ''}`,
      reviewHref,
    };
  }

  const n = Number.isFinite(activeLessonNum) && activeLessonNum > 0 ? Math.floor(activeLessonNum) : 1;
  return {
    kind: 'continue_lesson',
    href: `/hoc/${n}`,
    ctaText: `Tiếp tục Bài ${n}`,
    heading: `Bài đang học: Bài ${n}${activeLessonTitle ? ` — ${activeLessonTitle}` : ''}`,
    reviewHref,
  };
}
```

Lưu ý: heading người mới cũ là cố định `'Bắt đầu Bài 1: Giới thiệu bản thân'`; nay lấy theo `activeLessonTitle` (test Step 1 truyền đúng tiêu đề đó).

- [ ] **Step 4: Chạy, xác nhận đạt** — `node --test src/lib/dashboard-cta.test.ts`. Expected: PASS.
  `pnpm check` sẽ báo lỗi ở `DashboardContent.tsx` cho tới Task 6 — ghi nhận, **không** sửa `DashboardContent.tsx` trong task này.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/dashboard-cta.ts web/src/lib/dashboard-cta.test.ts
git commit -m "feat(home): primary CTA is always the lesson; reviews become a row"
```

---

### Task 4: Ảnh nhỏ cho phần bài trong `LessonSummary`

**Files:**
- Modify: `web/src/lib/lessons.ts:4-15` (interface) và `loadLessonSummary` (~dòng 178)
- Test: `web/src/lib/lessons.test.ts`

**Interfaces:**
- Produces: `LessonSummary.vocabThumb?: IllustrationAsset` (ảnh của từ đầu tiên có `illustration`), `LessonSummary.grammarThumb?: IllustrationAsset` (ảnh của mẫu ngữ pháp đầu tiên có `illustration`).

- [ ] **Step 1: Viết test hỏng** — thêm vào cuối `lessons.test.ts`:

```ts
test('loadLessonSummary kèm ảnh nhỏ thật cho phần Từ vựng/Ngữ pháp (Home v3)', async () => {
  clearLessonCache();
  const s = await loadLessonSummary(5);
  assert.ok(s.vocabThumb, 'Bài 5 có từ vựng minh họa');
  assert.match(s.vocabThumb.src, /^\/assets\/illustrations\/.+\.webp$/);
  const { lesson, vocab } = await loadLessonData(5);
  assert.deepEqual(s.vocabThumb, vocab.find((w) => w.illustration)?.illustration);
  assert.deepEqual(s.grammarThumb, lesson.grammar.find((g) => g.illustration)?.illustration);
});
```

- [ ] **Step 2: Chạy, xác nhận hỏng** — `node --test src/lib/lessons.test.ts`. Expected: FAIL (`vocabThumb` undefined).

- [ ] **Step 3: Cài đặt** — trong `interface LessonSummary` thêm sau `cover?`:

```ts
  /** Ảnh nhỏ cho hàng "Từ vựng" ở Bảng tin v3: minh họa của từ đầu tiên có ảnh. */
  vocabThumb?: IllustrationAsset;
  /** Ảnh nhỏ cho hàng "Ngữ pháp": minh họa của mẫu đầu tiên có ảnh. */
  grammarThumb?: IllustrationAsset;
```

Trong object trả về của `loadLessonSummary`, sau `cover: lesson.cover,`:

```ts
    vocabThumb: vocab.find((w) => w.illustration)?.illustration,
    grammarThumb: lesson.grammar.find((g) => g.illustration)?.illustration,
```

- [ ] **Step 4: Chạy, xác nhận đạt** — `node --test src/lib/lessons.test.ts`, rồi `pnpm test`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/lessons.ts web/src/lib/lessons.test.ts
git commit -m "feat(lessons): expose vocab/grammar thumbnails on LessonSummary"
```

---

### Task 5: Bộ thành phần giấy `PaperKit` (chạy sau Task 1)

**Files:**
- Create: `web/src/components/PaperKit.tsx`
- Modify: `web/src/app/globals.css` — thêm khối mới **ngay sau** khối `.paper-scene` / media query của nó (~dòng 185)

**Interfaces:**
- Consumes: `Illustration({ asset, sizes, className?, eager? })`, `IllustrationAsset` (`@/types`), `cn` (`@/lib/utils`).
- Produces:

```ts
SoftScene(props: { asset: IllustrationAsset; sizes: string; eager?: boolean; imageClassName?: string; className?: string; children?: ReactNode })
PaperCloud(props: { className?: string; children: ReactNode })
TornCard(props: { className?: string; children: ReactNode })
SectionHeader(props: { id: string; title: string; href?: string; linkLabel?: string })
ListRow(props: { href: string; onClick?: () => void; icon?: ReactNode; title: ReactNode; detail?: ReactNode; className?: string })
PartRow(props: { href: string; index: number; title: string; detail?: string; image?: IllustrationAsset; icon?: ReactNode })
```

- [ ] **Step 1: Thêm CSS vào `globals.css`** (sau khối `.paper-scene` và media query đi kèm):

```css
/* v3 "Sách sống" (docs/superpowers/specs/2026-10-08-maipace-visual-language-v3-design.md §3).
   Tranh giữ khung chữ nhật; chỉ một dải hẹp ở mỗi mép tan vào giấy. Hai mask giao nhau. */
.soft-scene {
  --fade-x: 1.75rem;
  --fade-top: 1.25rem;
  --fade-bottom: 2.5rem;
  mask-image:
    linear-gradient(to right, transparent, black var(--fade-x), black calc(100% - var(--fade-x)), transparent),
    linear-gradient(to bottom, transparent, black var(--fade-top), black calc(100% - var(--fade-bottom)), transparent);
  mask-composite: intersect;
}
.dark .soft-scene {
  filter: brightness(0.88);
}
/* Mây giấy sau khối chữ đặt trên tranh: lõi đục dưới chữ, chỉ viền tan. Tự đổi theo theme. */
.paper-cloud {
  position: relative;
  isolation: isolate;
}
.paper-cloud::before {
  content: "";
  position: absolute;
  inset: -0.875rem -1.375rem;
  z-index: -1;
  pointer-events: none;
  background: var(--background);
  filter: blur(14px);
  border-radius: 46% 54% 48% 52% / 52% 48% 54% 46%;
  box-shadow: 0 0 24px 14px var(--background);
}
/* Thẻ giấy washi mép xé. Bóng đặt ở lớp bọc vì clip-path cắt mất box-shadow. */
.torn-card-shadow {
  filter: drop-shadow(0 8px 18px color-mix(in oklch, var(--foreground) 12%, transparent));
}
.torn-card {
  background: var(--card);
  color: var(--card-foreground);
  clip-path: polygon(
    0% 1.2%, 3% 0.2%, 7% 1.1%, 12% 0.3%, 18% 1%, 25% 0.1%, 32% 1.1%, 40% 0.4%, 48% 1.2%, 56% 0.2%, 64% 0.9%, 72% 0.1%, 80% 1%, 88% 0.3%, 95% 1.2%, 100% 0.4%,
    99.7% 8%, 100% 18%, 99.6% 28%, 100% 38%, 99.5% 50%, 100% 62%, 99.6% 75%, 100% 88%, 99.5% 98%,
    98% 99.7%, 92% 99.1%, 85% 99.8%, 78% 99.2%, 70% 99.9%, 62% 99.3%, 54% 99.8%, 46% 99.1%, 38% 99.9%, 30% 99.2%, 22% 99.8%, 14% 99.1%, 7% 99.9%, 1% 99.2%, 0% 98%,
    0.4% 88%, 0% 76%, 0.5% 64%, 0% 50%, 0.4% 38%, 0% 26%, 0.5% 14%, 0% 4%
  );
}
```

- [ ] **Step 2: Tạo `web/src/components/PaperKit.tsx`**

```tsx
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Illustration } from '@/components/Illustration';
import type { IllustrationAsset } from '@/types';
import { cn } from '@/lib/utils';

/**
 * Bộ thành phần giấy v3 "Sách sống" (spec 2026-10-08 §3). Dùng song song PaperStage.tsx;
 * các màn cũ chuyển dần sang bộ này.
 */

/** Tranh chữ nhật, mép tan vào giấy. Ảnh lỗi thì chỉ còn nội dung con, chữ vẫn đọc được. */
export function SoftScene({
  asset,
  sizes,
  eager,
  imageClassName,
  className,
  children,
}: {
  asset: IllustrationAsset;
  sizes: string;
  eager?: boolean;
  /** Chiều cao tranh theo màn, ví dụ `h-48 sm:h-64`. */
  imageClassName?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn('relative', className)}>
      <Illustration
        asset={asset}
        sizes={sizes}
        eager={eager}
        className={cn('soft-scene w-full object-cover', imageClassName ?? 'h-48 sm:h-64')}
      />
      {children}
    </div>
  );
}

/** Nền mây giấy sau khối chữ đặt trên tranh (tăng tương phản, không thành hộp). */
export function PaperCloud({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('paper-cloud', className)}>{children}</div>;
}

/** Thẻ giấy washi mép xé, chứa đúng một hành động chính của màn. */
export function TornCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className="torn-card-shadow">
      <div className={cn('torn-card p-5 sm:p-6', className)}>{children}</div>
    </div>
  );
}

/** Tiêu đề mục + nút viên thuốc tùy chọn. Xuống dòng khi tiêu đề dài. */
export function SectionHeader({
  id,
  title,
  href,
  linkLabel = 'Xem tất cả',
}: {
  id: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <h2 id={id} className="text-lg font-semibold text-foreground">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="inline-flex min-h-9 items-center gap-0.5 rounded-full bg-secondary px-3 text-sm font-medium text-secondary-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring"
        >
          {linkLabel}
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

/** Dòng giấy: cả dòng là link; icon và chevron bám dòng đầu khi chữ xuống dòng. */
export function ListRow({
  href,
  onClick,
  icon,
  title,
  detail,
  className,
}: {
  href: string;
  onClick?: () => void;
  icon?: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex min-h-14 items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring',
        className,
      )}
    >
      {icon && (
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground [&_svg]:size-5"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 pt-1">
        <span className="block font-medium text-foreground">{title}</span>
        {detail && <span className="mt-0.5 block text-sm text-muted-foreground">{detail}</span>}
      </span>
      <ChevronRight className="mt-2 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}

/** Hàng phần bài: số thứ tự, tiêu đề, số liệu, ảnh nhỏ thật (hoặc icon). */
export function PartRow({
  href,
  index,
  title,
  detail,
  image,
  icon,
}: {
  href: string;
  index: number;
  title: string;
  detail?: string;
  image?: IllustrationAsset;
  icon?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-16 items-start gap-3 rounded-xl border border-border bg-card p-3 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring"
    >
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold tabular-nums text-accent-foreground">
        {index}
      </span>
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="block font-medium text-foreground">{title}</span>
        {detail && <span className="block text-sm text-muted-foreground">{detail}</span>}
      </span>
      {image ? (
        <Illustration asset={image} sizes="48px" className="size-12 shrink-0 rounded-lg object-contain" />
      ) : (
        icon && (
          <span className="flex size-12 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-6" aria-hidden="true">
            {icon}
          </span>
        )
      )}
    </Link>
  );
}
```

- [ ] **Step 3: Kiểm tra** — `pnpm exec tsc --noEmit -p .` và `pnpm lint`. Expected: không lỗi trong `PaperKit.tsx` (lỗi còn lại chỉ ở `DashboardContent.tsx` do Task 3, sẽ hết sau Task 6).

- [ ] **Step 4: Commit**

```bash
git add web/src/components/PaperKit.tsx web/src/app/globals.css
git commit -m "feat(ui-v3): PaperKit primitives (soft scene, paper cloud, torn card, rows)"
```

---

### Task 6: Home C2 (`DashboardContent.tsx`)

**Files:**
- Modify: `web/src/components/DashboardContent.tsx` (viết lại toàn bộ)

**Interfaces:**
- Consumes: Task 2 `Furigana` (+ class `jp-display` Task 1), Task 3 `resolveDashboardCta({ isNewUser, activeLessonNum, activeLessonTitle, hasPracticeDraft })` → `{ href, ctaText, reviewHref }`, Task 4 `activeSummary.vocabThumb/grammarThumb`, Task 5 `SoftScene, PaperCloud, TornCard, SectionHeader, ListRow, PartRow`.
- Giữ props `DashboardContent({ summaries, lessonExamples })` — `app/page.tsx` không đổi.

- [ ] **Step 1: Thay toàn bộ file**

```tsx
'use client';

import { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, CalendarDays, Clock, Dumbbell, Headphones, TableProperties } from 'lucide-react';
import { db } from '@/lib/db';
import { useDueQueue } from '@/lib/use-due-queue';
import { countLearnedByLesson, pickActiveLesson } from '@/lib/stats';
import { DEFAULT_SETTINGS, getSettingsSnapshot, subscribeSettings } from '@/lib/settings';
import { useActiveDrafts } from '@/lib/active-drafts';
import { clearNewSessionRequest } from '@/lib/practice-draft';
import { resolveDashboardCta } from '@/lib/dashboard-cta';
import type { LessonSummary } from '@/lib/lessons';
import type { IllustrationAsset } from '@/types';
import { SoftScene, PaperCloud, TornCard, SectionHeader, ListRow, PartRow } from '@/components/PaperKit';
import { Illustration } from '@/components/Illustration';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Furigana } from '@/components/Furigana';
import { SpeakButton } from '@/components/SpeakButton';
import { stripFurigana, toKanaSentence } from '@/lib/japanese';
import { pickTodaySentence, type TodaySentenceItem } from '@/lib/today-sentence';

const FALLBACK_COVER: IllustrationAsset = {
  src: '/assets/illustrations/scenes/self-introduction-v1.webp',
  width: 800,
  height: 600,
  alt: { vi: '' },
};

const DONE_ASSET: IllustrationAsset = {
  src: '/assets/illustrations/ui/states/review-complete-v1.webp',
  width: 512,
  height: 512,
  alt: { vi: '' },
};

/** Bảng tin v3 "Sách sống", bố cục C2 (spec 2026-10-08 §4). */
export function DashboardContent({
  summaries,
  lessonExamples = {},
}: {
  summaries: LessonSummary[];
  lessonExamples?: Record<number, TodaySentenceItem[]>;
}) {
  const queue = useDueQueue();
  const now = queue.now;
  const { learnedThroughLesson } = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    () => DEFAULT_SETTINGS,
  );
  const batchCount = queue.sessionTargetIds.size;
  const drafts = useActiveDrafts();

  const vocabTargetIds = useLiveQuery(
    () => db.reviewItems.where('targetId').startsWith('vocab-').primaryKeys(),
    [],
    [] as string[],
  );
  const learnedByLesson = useMemo(
    () => countLearnedByLesson(vocabTargetIds ?? []),
    [vocabTargetIds],
  );

  const activeLessonNum = pickActiveLesson(summaries, learnedByLesson, learnedThroughLesson);
  const activeSummary = summaries.find((s) => s.number === activeLessonNum) ?? summaries[0];
  const isNewUser =
    !queue.hasAnyReviewItem &&
    (vocabTargetIds?.length ?? 0) === 0 &&
    learnedThroughLesson === 0;

  const draftRows = [
    drafts.practiceDraft && {
      key: 'practice',
      title:
        drafts.practiceDraft.label +
        (drafts.practiceDraft.label === 'Luyện tập' &&
        drafts.practiceDraft.selectedLessons?.length
          ? ` Bài ${drafts.practiceDraft.selectedLessons.join(', ')}`
          : ''),
      detail: `Câu ${drafts.practiceDraft.currentQuestionIndex}/${drafts.practiceDraft.totalQuestions}`,
      href: drafts.practiceDraft.resumeHref,
      onClick: clearNewSessionRequest,
    },
    drafts.vocabDraft && {
      key: 'vocab',
      title: `Học từ vựng Bài ${drafts.vocabDraft.lesson}`,
      detail: `Từ ${drafts.vocabDraft.currentWordIndex}/${drafts.vocabDraft.totalWords}`,
      href: drafts.vocabDraft.resumeHref,
      onClick: undefined,
    },
  ].filter((row) => !!row);

  const cta = resolveDashboardCta({
    isNewUser,
    activeLessonNum,
    activeLessonTitle: activeSummary?.title?.vi,
    hasPracticeDraft: drafts.practiceDraft !== null,
  });

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  const coverAsset = activeSummary?.cover ?? summaries[0]?.cover ?? FALLBACK_COVER;

  const todaySentence = useMemo(
    () => pickTodaySentence(lessonExamples[activeLessonNum], now, activeLessonNum),
    [lessonExamples, now, activeLessonNum],
  );
  const heroJapanese = todaySentence?.jp ?? activeSummary?.jpTitle ?? '';
  const heroTranslation = todaySentence?.vi ?? activeSummary?.title?.vi ?? '';

  const dueSummaryText = [
    queue.totalDueCount > 0 ? `${queue.totalDueCount} mục đến hạn` : null,
    queue.newTargetIds.length > 0 ? `${queue.newTargetIds.length} mục mới` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const isDoneToday = !isNewUser && queue.hasAnyReviewItem && batchCount === 0;

  if (queue.loading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-3 sm:px-6 lg:px-8">
        <Skeleton className="-mx-4 h-48 w-[calc(100%+2rem)] rounded-none sm:mx-0 sm:h-64 sm:w-full" />
        <Skeleton className="mt-4 h-8 w-44" />
        <Skeleton className="mt-6 h-56 w-full rounded-xl" />
        <Skeleton className="mt-3 h-14 w-full rounded-xl" />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-12 pt-3 sm:px-6 lg:px-8">
      <SoftScene
        asset={coverAsset}
        sizes="(min-width: 1024px) 1024px, 100vw"
        eager
        imageClassName="h-48 object-center sm:h-64 lg:h-72"
        className="-mx-4 w-[calc(100%+2rem)] sm:mx-0 sm:w-full"
      />
      <PaperCloud className="-mt-7 w-fit">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {greeting}
        </h1>
      </PaperCloud>

      <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(21rem,0.8fr)]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="home-today-heading">
            <SectionHeader
              id="home-today-heading"
              title="Hôm nay"
              href={`/hoc/${activeLessonNum}`}
              linkLabel="Xem bài"
            />
            <TornCard>
              <p className="text-sm font-medium text-muted-foreground">
                Bài {activeLessonNum} · {activeSummary.title.vi}
              </p>
              {heroJapanese && (
                <div className="mt-3 flex items-start gap-2">
                  <Furigana
                    text={heroJapanese}
                    className="jp-display min-w-0 flex-1 text-2xl font-semibold text-foreground sm:text-3xl"
                  />
                  {todaySentence && (
                    <SpeakButton
                      text={todaySentence.kana || toKanaSentence(todaySentence.jp)}
                      label={stripFurigana(todaySentence.jp)}
                      iconClassName="size-4"
                    />
                  )}
                </div>
              )}
              {heroTranslation && (
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{heroTranslation}</p>
              )}
              <Link
                href={cta.href}
                className={cn(buttonVariants({ size: 'quiz' }), 'mt-5 w-full font-semibold')}
              >
                {cta.ctaText}
                <ArrowRight aria-hidden="true" />
              </Link>
            </TornCard>

            <div className="mt-3 space-y-2">
              {draftRows.map((row) => (
                <ListRow
                  key={row.key}
                  href={row.href}
                  onClick={row.onClick}
                  icon={<Clock />}
                  title={row.title}
                  detail={row.detail}
                />
              ))}
              {batchCount > 0 && (
                <ListRow
                  href={cta.reviewHref}
                  icon={<CalendarDays />}
                  title="Ôn tập đến hạn"
                  detail={dueSummaryText || `${batchCount} mục`}
                />
              )}
              {isDoneToday && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <Illustration asset={DONE_ASSET} sizes="56px" className="size-14 shrink-0 object-contain" />
                  <p className="font-medium text-foreground">Đã xong phần ôn hôm nay</p>
                </div>
              )}
              {isDoneToday && (
                <ListRow href="/luyen-tap" icon={<Dumbbell />} title="Luyện tập tự chọn" />
              )}
            </div>
          </section>

          <section aria-labelledby="home-parts-heading">
            <SectionHeader id="home-parts-heading" title="Các phần trong bài" />
            <div className="space-y-2">
              <PartRow
                href={`/hoc/${activeLessonNum}/tu-vung`}
                index={1}
                title="Từ vựng"
                detail={`${activeSummary.vocabCount} từ`}
                image={activeSummary.vocabThumb}
              />
              <PartRow
                href={`/hoc/${activeLessonNum}#ngu-phap`}
                index={2}
                title="Ngữ pháp"
                detail={`${activeSummary.grammarCount} mẫu`}
                image={activeSummary.grammarThumb}
              />
              <PartRow
                href={`/hoc/${activeLessonNum}#nghe`}
                index={3}
                title="Luyện nghe"
                icon={<Headphones />}
              />
            </div>
          </section>
        </div>

        <aside className="min-w-0">
          <section aria-labelledby="home-quick-search" className="xl:sticky xl:top-6">
            <SectionHeader id="home-quick-search" title="Tra cứu" />
            <div className="flex gap-2">
              <SearchTrigger
                variant="bar"
                placeholder="Tìm từ, ngữ pháp, kanji…"
                className="min-w-0 flex-1 rounded-xl shadow-none"
              />
              <Link
                href="/hoc/tra-cuu"
                aria-label="Bảng tra"
                title="Bảng tra"
                className={cn(buttonVariants({ variant: 'outline', size: 'icon-lg' }), 'size-11 shrink-0 rounded-xl')}
              >
                <TableProperties className="size-5" aria-hidden="true" />
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
```

Ghi chú cho người thực thi:
- `Dumbbell`, `Headphones`, `TableProperties`, `ArrowRight` có trong `lucide-react`; nếu `tsc` báo thiếu, chọn icon gần nghĩa có sẵn (vd. `Table2`), không thêm gói.
- Bỏ có chủ đích so với bản cũ: thanh tiến độ từ vựng, ước tính phút, câu mô tả "Tìm từ vựng…" (luật §2.5); `Progress`, `secondsPerQuestion`, truy vấn `practiceSessions` không còn dùng → không import.
- Nếu `SearchTrigger variant="bar"` cao khác 44px (`size-11`), chỉnh `size-11` cho bằng chiều cao ô tìm.

- [ ] **Step 2: Kiểm tra** — `pnpm check` và `pnpm test`. Expected: PASS toàn bộ (lỗi Task 3/5 đã hết).

- [ ] **Step 3: Không còn dùng `PaperStage` ở Home** — `grep -n "PaperStage" src/components/DashboardContent.tsx` → không có. `PaperStage.tsx` giữ nguyên cho 7 màn khác.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/DashboardContent.tsx
git commit -m "feat(home): rebuild Home on v3 PaperKit (C2 soft scene, torn card, rows)"
```

---

### Task 7: Nghiệm thu (coordinator, không giao worker)

**Files:** không sửa code trừ khi phát hiện lỗi (sửa ở task tương ứng). Ảnh chụp vào `design-lab/review/app-*.png` (không commit).

- [ ] **Step 1: Build** — `pnpm build`. Expected: build thành công.
- [ ] **Step 2: Dev server riêng** — `pnpm exec next dev --port 3100`; mở `http://localhost:3100/`, xác nhận `<title>` là MaiPace.
- [ ] **Step 3: Seed 4 trạng thái** bằng `indexedDB.open('JapaneseLearningDB')` qua `agent-browser eval --stdin` (theme từ localStorage `jp:settings`):
  mới (DB trống) · bình thường (có `reviewItems` vocab Bài 1–4, không đến hạn ngày mai) · nhiều việc (nháp luyện tập + ≥ 18 mục đến hạn) · xong hôm nay (`reviewItems` có, 0 đến hạn).
- [ ] **Step 4: Chụp và so** ở 360/390/1280 px × sáng/tối × 4 trạng thái, đặt cạnh `design-lab/home-v3.html` khung C2. Kiểm:
  - tranh chữ nhật mờ mép, không viền cứng; bản tối không chói;
  - lời chào một dòng đọc rõ trên mây giấy (đo tương phản thân ≥ 4.5:1 nếu chữ nằm trên tranh);
  - câu Nhật chỉ xuống dòng giữa cụm; bật furigana lớn (`html.furigana-large`) và thử tên bài dài;
  - nút chính luôn "Bắt đầu Bài 1"/"Tiếp tục Bài N"; dòng ôn/nháp đúng đích (`/on-tap` khi có nháp luyện);
  - không có chữ giải thích thừa; nút/link đủ 44px; Tab đi đúng thứ tự, focus thấy rõ;
  - mất mạng trong tab đang mở: ảnh lỗi → chữ vẫn đọc được.
- [ ] **Step 5: Màn khác không vỡ** — mở nhanh `/hoc`, `/hoc/5`, `/luyen-tap`, `/on-tap`, `/hoc/tra-cuu` ở 390 px sáng/tối: font mới hiển thị đúng, `Furigana` xuống dòng hợp lý.
- [ ] **Step 6: Ghi bàn giao** — cập nhật `docs/specs/README.md` (mục mới "UI v3 Home") và `docs/handoff/UI-V3-HOME.md` theo mẫu `docs/handoff/PROMPT-phien-moi.md`: ngày, quyết định, file, kiểm tra đã chạy, phần chưa kiểm chứng (thiết bị thật, reduced motion…), bước tiếp (7 màn, tranh hero → C1, viết lại `DESIGN.md`/`AGENTS.md`).
