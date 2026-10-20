import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { validateIllustrationAsset } from './illustrations.ts';
import { AVAILABLE_N5_LESSONS, loadLessonData } from './lessons.ts';

type LinkedData = {
  cover?: { src: string };
  grammar?: { id: string; illustration?: { src: string } }[];
  words?: { id: string; illustration?: { src: string } }[];
  dialogues?: { id: string; illustration?: { src: string } }[];
  [key: string]: unknown;
};

const validAsset = {
  src: '/assets/illustrations/vocab/book-v1.webp',
  width: 512,
  height: 512,
  alt: { vi: 'Một quyển sách.' },
};

test('image metadata rejects external, traversal, unversioned and malformed references', () => {
  assert.doesNotThrow(() => validateIllustrationAsset(validAsset));
  assert.doesNotThrow(() => validateIllustrationAsset({ ...validAsset, alt: { vi: '' } }));
  assert.doesNotThrow(() => validateIllustrationAsset({
    src: '/assets/illustrations/characters/mai-portrait-v1.webp',
    width: 512,
    height: 512,
    alt: { vi: 'Chân dung Mai.' },
  }));
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
    const assets = [
      lesson.cover,
      ...lesson.grammar.map(p => p.illustration),
      ...(lesson.dialogues ?? []).map(d => d.illustration),
      ...vocab.map(w => w.illustration),
    ].filter(a => a !== undefined);
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
  const repo = new URL('../../../', import.meta.url);
  const charactersPath = new URL('web/src/data/n5/characters.json', repo);
  const charactersText = await readFile(charactersPath, 'utf8').catch(() => '{}');
  const charactersData = JSON.parse(charactersText) as Record<string, { avatar?: typeof validAsset }>;
  for (const char of Object.values(charactersData)) {
    if (char?.avatar) {
      validateIllustrationAsset(char.avatar);
      let dir = new URL('../../public/', import.meta.url);
      for (const segment of char.avatar.src.slice(1).split('/')) {
        assert.ok((await readdir(dir)).includes(segment), `Missing/case mismatch: ${char.avatar.src}`);
        dir = new URL(segment + (segment.endsWith('.webp') ? '' : '/'), dir);
      }
      const bytes = await readFile(dir);
      const metadata = await sharp(bytes).metadata();
      assert.equal(metadata.format, 'webp');
      assert.equal(metadata.width, char.avatar.width);
      assert.equal(metadata.height, char.avatar.height);
      references++;
    }
  }
  assert.ok(references > 0);
  // Every sidecar that batch.mjs marked as linked must still be referenced where it says, so
  // dropping an image from the learning JSON fails here without hand-kept ID lists or counts.
  const data = new Map<string, LinkedData>();
  let linked = 0;
  const walk = async (dir: URL): Promise<void> => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!['atlases', 'batches', 'reference', 'reports', 'tools'].includes(entry.name)) await walk(new URL(`${entry.name}/`, dir));
        continue;
      }
      if (!entry.name.endsWith('.json')) continue;
      const sidecar = JSON.parse(await readFile(new URL(entry.name, dir), 'utf8'));
      const target = sidecar.intendedContent;
      if (target?.referenceStatus !== 'added-to-learning-data') continue;
      if (!data.has(target.dataFile)) data.set(target.dataFile, JSON.parse(await readFile(new URL(target.dataFile, repo), 'utf8')));
      const json = data.get(target.dataFile)!;
      const linkedAsset = target.dataFile.includes('characters.json')
        ? (json[target.roleId ?? target.id] as { avatar?: { src: string } } | undefined)?.avatar
        : target.field === 'cover'
        ? json.cover
        : target.dataFile.includes('/lessons/')
        ? json.dialogues?.find((d: { id: string }) => d.id === (target.dialogue ?? target.id))?.illustration
          ?? json.grammar?.find((g: { id: string }) => g.id === target.id)?.illustration
        : json.words?.find((w: { id: string }) => w.id === target.id)?.illustration;
      assert.equal(linkedAsset?.src, sidecar.output.replace('web/public', ''),
        `${entry.name} is not linked at ${target.dataFile} ${target.id ?? target.field ?? target.roleId}`);
      linked++;
    }
  };
  await walk(new URL('artwork/illustrations/', repo));
  assert.ok(linked > 0);
  const { lesson } = await loadLessonData(2);
  const caption = lesson.grammar.find(p => p.id === 'kore-sore-are')?.illustrationCaption?.vi;
  for (const text of ['これ', 'それ', 'あれ', 'người nói', 'người nghe']) {
    assert.ok(caption?.includes(text), `Caption lost Japanese/Vietnamese characters: ${text}`);
  }
  const third = await loadLessonData(3);
  const placeCaption = third.lesson.grammar.find(p => p.id === 'koko-soko-asoko')?.illustrationCaption?.vi;
  for (const text of ['ここ', 'そこ', 'あそこ', 'người nói', 'người nghe']) {
    assert.ok(placeCaption?.includes(text), `Caption lost Japanese/Vietnamese characters: ${text}`);
  }
});
