# Prompt ChatGPT — 6 cutout tạo lại riêng (06/10/2026)

Sáu ô này trong atlas ChatGPT ngày 05/10 dính dải alpha mờ vào ô bên cạnh, nên không có đường cắt alpha 0. Theo fallback trong STYLE.md, mỗi ô được tạo lại thành một ảnh riêng; không tẩy pixel.

Mỗi ảnh: mở chat mới, **đính kèm** `artwork/illustrations/reference/paper-town-style-v1.png`, dán khối "Chung" rồi thêm dòng "Chủ thể" của ảnh đó. Tải PNG về và lưu đúng tên ghi ở "Lưu thành". Nếu ảnh ra nền trắng hoặc nền caro, nhắn tiếp: "Same image, but export as PNG with a truly transparent background (alpha channel)".

## Chung

```text
Create ONE square 1:1 illustration for a Japanese-learning app's vocabulary card.
STYLE: match the attached reference image exactly ("paper town"): hand-painted watercolor/gouache with fine dark pencil outlines, soft painted shapes, subtle paper grain only inside the painted shapes; warm ivory/sand, sage/olive green, charcoal, restrained brick red. Not photoreal, not 3D, not flat geometric cartoon.
People, when present: the male student = short slightly messy dark hair, long-sleeve ivory shirt, charcoal trousers, dark backpack; the woman = dark bob haircut, cream cardigan, brick-red top, charcoal skirt, brown bag.
LAYOUT: a single standalone cutout vignette centered, occupying about 70% of the canvas, with wide EMPTY margins on all four sides; nothing touches the canvas edge; no soft background wash, no paper rectangle, no floor shadow spreading to the edges, no stray specks.
BACKGROUND: fully TRANSPARENT (real PNG alpha channel). No white, no fake checkerboard.
ABSOLUTELY NO text, letters, Japanese characters, numbers, digits, logos, signs with writing, labels, captions or watermark. Books, papers, lanterns and signs stay blank.
SUBJECT:
```

| Lưu thành | Chủ thể (dán sau dòng SUBJECT:) |
| --- | --- |
| `artwork/illustrations/vocab/restaurant-v1.png` | restaurant: a dining table with a white tablecloth, two plates, wine glasses, a lit candle and a small vase, with two red upholstered chairs |
| `artwork/illustrations/vocab/dormitory-v1.png` | student dormitory: a two-storey building with rows of identical windows and balconies with laundry hanging, a few shrubs, no sign |
| `artwork/illustrations/vocab/quiet-library-v1.png` | quiet: the reference woman reading a book alone in an armchair by a window with a plant and a cup, calm and peaceful, nobody else around |
| `artwork/illustrations/vocab/lively-street-v1.png` | lively/bustling: a crowded festival street with many small people, a row of blank paper lanterns and food stalls with striped awnings |
| `artwork/illustrations/vocab/busy-worker-v1.png` | busy: an office worker in shirt and tie talking on a phone while holding a pile of papers, a laptop and scattered documents on the desk, hurried expression |
| `artwork/illustrations/vocab/having-fun-v1.png` | fun: the reference student and woman laughing together on a checkered picnic blanket with cups and a food basket under a tree |
