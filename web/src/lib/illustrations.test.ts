import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { validateIllustrationAsset } from './illustrations.ts';
import { AVAILABLE_N5_LESSONS, loadLessonData } from './lessons.ts';

const validAsset = {
  src: '/assets/illustrations/vocab/book-v1.webp',
  width: 512,
  height: 512,
  alt: { vi: 'Một quyển sách.' },
};

test('image metadata rejects external, traversal, unversioned and malformed references', () => {
  assert.doesNotThrow(() => validateIllustrationAsset(validAsset));
  assert.doesNotThrow(() => validateIllustrationAsset({ ...validAsset, alt: { vi: '' } }));
  for (const src of [
    'https://example.com/book.webp', 'data:image/webp;base64,abc',
    '/assets/illustrations/vocab/../book-v1.webp', '/assets/illustrations/vocab/Book-v1.webp',
    '/assets/illustrations/vocab/book.webp', '/assets/illustrations/vocab/book-v0.webp',
    '/assets/illustrations/vocab/book-v1.png', '/assets/illustrations/vocab/book-v1.webp?x=1',
    'D:\\assets\\book-v1.webp',
  ]) assert.throws(() => validateIllustrationAsset({ ...validAsset, src }));
  for (const width of [0, -1, 12.5, NaN, Infinity, '512']) {
    assert.throws(() => validateIllustrationAsset({ ...validAsset, width }));
  }
  for (const bad of [null, [], {}, { ...validAsset, height: 0 },
    { ...validAsset, alt: null }, { ...validAsset, alt: { vi: 1 } },
    { ...validAsset, alt: { vi: '', en: false } }]) {
    assert.throws(() => validateIllustrationAsset(bad));
  }
});

test('bundled references exist with exact case and match decoded image dimensions', async () => {
  const require = createRequire(import.meta.url);
  // Next.js already supplies Sharp; this adds no dependency to the app.
  const sharp = createRequire(require.resolve('next/package.json'))('sharp');
  let references = 0;
  for (const number of AVAILABLE_N5_LESSONS) {
    const { lesson, vocab } = await loadLessonData(number);
    const assets = [lesson.cover, ...lesson.grammar.map(p => p.illustration),
      ...vocab.map(w => w.illustration)].filter(a => a !== undefined);
    for (const asset of assets) {
      validateIllustrationAsset(asset);
      let dir = new URL('../../public/', import.meta.url);
      for (const segment of asset.src.slice(1).split('/')) {
        assert.ok((await readdir(dir)).includes(segment), `Missing/case mismatch: ${asset.src}`);
        dir = new URL(segment + (segment.endsWith('.webp') ? '' : '/'), dir);
      }
      const bytes = await readFile(dir);
      const metadata = await sharp(bytes).metadata();
      assert.equal(metadata.format, 'webp');
      assert.equal(metadata.width, asset.width);
      assert.equal(metadata.height, asset.height);
      references++;
    }
  }
  assert.equal(references, 42);
  const first = await loadLessonData(1);
  assert.deepEqual(first.vocab.filter(w => w.illustration).map(w => w.id), ['gakusei', 'isha']);
  const eighth = await loadLessonData(8);
  assert.equal(eighth.lesson.cover?.src, '/assets/illustrations/scenes/adjective-town-v1.webp');
  assert.deepEqual(eighth.vocab.filter(w => w.illustration).map(w => w.id),
    ['ookii', 'chiisai', 'atarashii', 'furui', 'atsui', 'samui', 'tsumetai', 'oishii',
      'shiroi', 'kuroi', 'akai', 'aoi', 'sakura', 'yama', 'machi', 'tabemono']);
  const { lesson, vocab } = await loadLessonData(2);
  assert.deepEqual(vocab.filter(w => w.illustration).map(w => w.id),
    ['hon', 'zasshi', 'nooto', 'techou', 'enpitsu', 'boorupen', 'shaapupenshiru', 'kagi', 'tokei',
      'kasa', 'kaban', 'cd', 'terebi', 'rajio', 'kamera', 'konpyuutaa', 'kuruma',
      'tsukue', 'isu', 'chokoreeto', 'koohii']);
  const caption = lesson.grammar.find(p => p.id === 'kore-sore-are')?.illustrationCaption?.vi;
  for (const text of ['これ', 'それ', 'あれ', 'người nói', 'người nghe']) {
    assert.ok(caption?.includes(text), `Caption lost Japanese/Vietnamese characters: ${text}`);
  }
});
