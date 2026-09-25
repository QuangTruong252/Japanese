/**
 * Mẫu manifest.json chuẩn cho nạp audio (SPEC-09 & Feedback #34)
 * Khớp hoàn toàn với schema validator trong web/src/lib/audio-zip.ts
 */

export const SAMPLE_MANIFEST_RECORD: Record<string, string> = {
  'L01/01_vocab.mp3': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  'L01/02_sentence_patterns.mp3': 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
};

export const SAMPLE_MANIFEST_JSON = JSON.stringify(SAMPLE_MANIFEST_RECORD, null, 2);

export interface ManifestFieldDoc {
  name: string;
  role: string;
  description: string;
}

export const MANIFEST_FIELD_DOCS: ManifestFieldDoc[] = [
  {
    name: 'Khóa (Key)',
    role: 'Đường dẫn file MP3',
    description: 'Đường dẫn tương đối từ gốc gói ZIP, chuẩn L{01..25}/{01..04}_{vocab|sentence_patterns|examples|conversation}.mp3',
  },
  {
    name: 'Giá trị (Value)',
    role: 'Mã SHA-256',
    description: 'Chuỗi hex 64 ký tự băm từ nội dung file MP3 tương ứng, dùng để kiểm tra tính toàn vẹn khi giải nén',
  },
];
