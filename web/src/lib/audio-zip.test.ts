import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseAudioTrackPath,
  validateZipLimits,
  parseAndValidateManifest,
  formatStorageSize,
  detectHashConflicts,
  MAX_ZIP_FILE_SIZE,
  MAX_ZIP_ENTRIES,
  MAX_UNCOMPRESSED_TOTAL,
  MAX_SINGLE_FILE_SIZE,
  MAX_COMPRESSION_RATIO,
} from './audio-zip.ts';

test('parseAudioTrackPath: chấp nhận đường dẫn chuẩn 25 bài', () => {
  assert.deepEqual(parseAudioTrackPath('L01/01_vocab.mp3'), {
    lesson: 1,
    trackNumber: 1,
    type: 'vocab',
  });

  assert.deepEqual(parseAudioTrackPath('L07/02_sentence_patterns.mp3'), {
    lesson: 7,
    trackNumber: 2,
    type: 'sentence_patterns',
  });

  assert.deepEqual(parseAudioTrackPath('L12/03_examples.mp3'), {
    lesson: 12,
    trackNumber: 3,
    type: 'examples',
  });

  assert.deepEqual(parseAudioTrackPath('L25/04_conversation.mp3'), {
    lesson: 25,
    trackNumber: 4,
    type: 'conversation',
  });
});

test('parseAudioTrackPath: từ chối các đường dẫn sai hoặc nguy hiểm', () => {
  // Path traversal
  assert.equal(parseAudioTrackPath('../L01/01_vocab.mp3'), null);
  assert.equal(parseAudioTrackPath('L01/../../evil.mp3'), null);
  // Lesson ngoài khoảng 1..25
  assert.equal(parseAudioTrackPath('L00/01_vocab.mp3'), null);
  assert.equal(parseAudioTrackPath('L26/01_vocab.mp3'), null);
  // Track ngoài 4 loại chuẩn
  assert.equal(parseAudioTrackPath('L01/05_bonus.mp3'), null);
  assert.equal(parseAudioTrackPath('L01/01_vocab.wav'), null);
  assert.equal(parseAudioTrackPath('L01/01_vocab.txt'), null);
  assert.equal(parseAudioTrackPath('manifest.json'), null);
  assert.equal(parseAudioTrackPath('random_file.mp3'), null);
});

test('validateZipLimits: kiểm tra các giới hạn tài nguyên trước khi giải nén', () => {
  // Hợp lệ
  assert.deepEqual(
    validateZipLimits({
      fileSize: 500 * 1024 * 1024,
      entryCount: 101,
      uncompressedTotal: 600 * 1024 * 1024,
      maxSingleSize: 15 * 1024 * 1024,
      maxCompressionRatio: 1.5,
    }),
    { valid: true }
  );

  // File ZIP vượt 2 GB
  assert.equal(
    validateZipLimits({ fileSize: MAX_ZIP_FILE_SIZE + 1 }).valid,
    false
  );

  // Số lượng entry vượt 200
  assert.equal(
    validateZipLimits({ entryCount: MAX_ZIP_ENTRIES + 1 }).valid,
    false
  );

  // Tổng dung lượng uncompressed vượt 4 GB
  assert.equal(
    validateZipLimits({ uncompressedTotal: MAX_UNCOMPRESSED_TOTAL + 1 }).valid,
    false
  );

  // Tỉ lệ nén vượt 100x (nghi ngờ zip-bomb)
  assert.equal(
    validateZipLimits({ maxCompressionRatio: MAX_COMPRESSION_RATIO + 1 }).valid,
    false
  );

  // File đơn lẻ vượt 100 MB
  assert.equal(
    validateZipLimits({ maxSingleSize: MAX_SINGLE_FILE_SIZE + 1 }).valid,
    false
  );
});

test('parseAndValidateManifest: kiểm tra tính hợp lệ của manifest.json', () => {
  // Hợp lệ
  const validJson = JSON.stringify({
    'L01/01_vocab.mp3': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'L01/02_sentence_patterns.mp3': 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
  });
  const res = parseAndValidateManifest(validJson);
  assert.equal(res.valid, true);
  assert.ok(res.manifest);
  assert.equal(Object.keys(res.manifest).length, 2);

  // JSON hỏng
  assert.equal(parseAndValidateManifest('not a json').valid, false);

  // Rỗng
  assert.equal(parseAndValidateManifest('{}').valid, false);

  // Chứa hash không phải sha256 64 hex chars
  const invalidHashJson = JSON.stringify({
    'L01/01_vocab.mp3': 'not-a-valid-sha256-hex',
  });
  assert.equal(parseAndValidateManifest(invalidHashJson).valid, false);
});

test('formatStorageSize: định dạng dung lượng byte thành chuỗi người dùng', () => {
  assert.equal(formatStorageSize(0), '0 B');
  assert.equal(formatStorageSize(1024), '1 KB');
  assert.equal(formatStorageSize(1024 * 1024 * 1.5), '1.5 MB');
  assert.equal(formatStorageSize(1024 * 1024 * 412), '412 MB');
  assert.equal(formatStorageSize(1024 * 1024 * 1024 * 4.2), '4.2 GB');
});

test('detectHashConflicts: phát hiện track khác biệt so với lần nạp trước (TOFU)', () => {
  const existing = {
    'L01/01_vocab.mp3': 'hash_aaa',
    'L01/02_sentence_patterns.mp3': 'hash_bbb',
  };

  const incomingSame = {
    'L01/01_vocab.mp3': 'hash_aaa',
    'L01/02_sentence_patterns.mp3': 'hash_bbb',
    'L01/03_examples.mp3': 'hash_ccc',
  };
  assert.deepEqual(detectHashConflicts(existing, incomingSame), []);

  const incomingDifferent = {
    'L01/01_vocab.mp3': 'hash_aaa_MODIFIED',
    'L01/02_sentence_patterns.mp3': 'hash_bbb',
  };
  assert.deepEqual(detectHashConflicts(existing, incomingDifferent), ['L01/01_vocab.mp3']);
});
