import * as wanakana from 'wanakana';
import { stripFurigana } from './japanese.ts';
import { getAllKanji, getAllVerbs, getAllReferenceDocs } from './lookup.ts';
import { loadLesson, loadVocab } from './lessons.ts';

export type SearchKind = 'feature' | 'vocab' | 'grammar' | 'kanji' | 'verb' | 'table' | 'lesson';

export interface SearchEntry {
  id: string;
  kind: SearchKind;
  label: string;
  sublabel: string;
  keys: string[];
  lesson?: number;
  badge?: string;
  href: string;
}

const KIND_ORDER: readonly SearchKind[] = [
  'feature',
  'vocab',
  'grammar',
  'kanji',
  'verb',
  'table',
  'lesson',
];

const MAX_PER_GROUP: Record<SearchKind, number> = {
  feature: 4,
  vocab: 5,
  grammar: 5,
  kanji: 5,
  verb: 5,
  table: 5,
  lesson: 5,
};

/**
 * Chuẩn hóa chuỗi tìm kiếm (SPEC-13 §2.2):
 * 1. Chữ thường, gộp khoảng trắng
 * 2. Bỏ dấu tiếng Việt NFD
 * 3. Bắt buộc thay đ/Đ thành d (ca kiểm thử: dong tu -> động từ, do an -> đồ ăn)
 * 4. Xóa notation Furigana nếu có
 */
export function normalizeSearchText(text: string): string {
  if (!text) return '';
  const stripped = stripFurigana(text);
  return stripped
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC')
    .replace(/[đĐ]/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

let cachedSearchIndex: SearchEntry[] | null = null;

export function getCachedSearchIndex(): SearchEntry[] | null {
  return cachedSearchIndex;
}

/**
 * Danh sách điểm đến tính năng tĩnh cho hộp tìm kiếm (SPEC-17 §2).
 * Cung cấp đường vào nhanh cho các phân hệ của app khi người dùng gõ tên hoặc alias.
 */
export function getFeatureEntries(): SearchEntry[] {
  const rawFeatures: Array<{
    id: string;
    label: string;
    sublabel: string;
    badge: string;
    href: string;
    aliases: string[];
  }> = [
    {
      id: 'feature-tra-cuu',
      label: 'Tra cứu',
      sublabel: 'Trung tâm tra cứu: Kana, Kanji, Động từ, Bảng tham chiếu',
      badge: 'Tính năng',
      href: '/hoc/tra-cuu',
      aliases: ['tra cuu', 'tra tu', 'lookup', 'hub tra cuu', 'tu dien'],
    },
    {
      id: 'feature-kana',
      label: 'Bảng chữ Kana',
      sublabel: 'Bảng chữ cái Hiragana & Katakana · 46 âm cơ bản',
      badge: 'Tra cứu',
      href: '/hoc/tra-cuu/kana',
      aliases: ['kana', 'bang chu kana', 'bang chu cai', 'hiragana', 'katakana', 'chu cai', 'bang kana'],
    },
    {
      id: 'feature-kanji',
      label: 'Tra cứu Kanji',
      sublabel: '169 chữ Kanji N5 kèm âm On, Kun, số nét và từ ghép',
      badge: 'Tra cứu',
      href: '/hoc/tra-cuu/kanji',
      aliases: ['kanji', 'tra cuu kanji', 'chu han', 'han tu', 'bang kanji'],
    },
    {
      id: 'feature-dong-tu',
      label: 'Tra cứu Động từ',
      sublabel: '156 động từ N5 · 5 thể chia: ます, て, từ điển, ない, た',
      badge: 'Tra cứu',
      href: '/hoc/tra-cuu/dong-tu',
      aliases: ['dong tu', 'tra cuu dong tu', 'bang dong tu', 'verbs', 'the dong tu', 'chia dong tu'],
    },
    {
      id: 'feature-bang',
      label: 'Bảng tham chiếu',
      sublabel: '10 bảng tra cứu nhanh chuyên đề ngữ pháp và từ vựng N5',
      badge: 'Tra cứu',
      href: '/hoc/tra-cuu/bang',
      aliases: ['bang tham chieu', 'tham chieu', 'bang tra cuu', 'reference', '10 bang tham chieu'],
    },
    {
      id: 'feature-thong-ke',
      label: 'Thống kê',
      sublabel: 'Tiến độ học, tỷ lệ đúng, lịch học và phân bố SRS',
      badge: 'Tính năng',
      href: '/thong-ke',
      aliases: ['thong ke', 'tien do', 'stats', 'statistics', 'bieu do', 'ti le dung'],
    },
    {
      id: 'feature-hoc',
      label: 'Học bài',
      sublabel: 'Danh sách 25 bài học Minna no Nihongo N5',
      badge: 'Tính năng',
      href: '/hoc',
      aliases: ['hoc', 'hoc bai', 'bai hoc', 'danh sach bai', 'lessons'],
    },
    {
      id: 'feature-luyen-tap',
      label: 'Luyện tập',
      sublabel: 'Luyện tập 5 dạng bài: trắc nghiệm, điền từ, ghép cặp, nghe',
      badge: 'Tính năng',
      href: '/luyen-tap',
      aliases: ['luyen tap', 'bai tap', 'practice', 'lam bai'],
    },
    {
      id: 'feature-on-tap',
      label: 'Ôn tập',
      sublabel: 'Ôn tập các mục đến hạn theo thuật toán ngắt quãng FSRS',
      badge: 'Tính năng',
      href: '/on-tap',
      aliases: ['on tap', 'on bai', 'review', 'fsrs', 'den han'],
    },
    {
      id: 'feature-diem-yeu',
      label: 'Điểm yếu',
      sublabel: 'Danh sách các mục ghi nhớ kém hoặc hay trả lời sai',
      badge: 'Tính năng',
      href: '/on-tap/diem-yeu',
      aliases: ['diem yeu', 'cau hay sai', 'muc hay sai', 'weak points'],
    },
    {
      id: 'feature-cai-dat',
      label: 'Cài đặt',
      sublabel: 'Cài đặt giao diện, âm thanh, sao lưu và đồng bộ dữ liệu',
      badge: 'Tính năng',
      href: '/cai-dat',
      aliases: ['cai dat', 'thiet lap', 'settings', 'sao luu', 'dong bo'],
    },
    {
      id: 'feature-audio',
      label: 'Audio CD',
      sublabel: 'Nạp âm thanh bài học từ file ZIP đĩa CD Minna no Nihongo',
      badge: 'Tính năng',
      href: '/cai-dat/audio',
      aliases: ['audio', 'audio cd', 'am thanh', 'audio zip', 'nap audio'],
    },
  ];

  return rawFeatures.map((f) => {
    const keySet = new Set<string>();
    keySet.add(normalizeSearchText(f.label));
    keySet.add(f.label.toLowerCase());
    for (const a of f.aliases) {
      keySet.add(normalizeSearchText(a));
      keySet.add(a.toLowerCase());
    }
    return {
      id: f.id,
      kind: 'feature' as const,
      label: f.label,
      sublabel: f.sublabel,
      badge: f.badge,
      href: f.href,
      keys: Array.from(keySet).filter(Boolean),
    };
  });
}

/**
 * Xây dựng chỉ mục tìm kiếm tĩnh.
 * Nạp bất đồng bộ khi mở hộp thoại lần đầu, lưu cache singleton.
 */
export async function buildSearchIndex(): Promise<SearchEntry[]> {
  if (cachedSearchIndex) {
    return cachedSearchIndex;
  }

  const entries: SearchEntry[] = [];

  // 0. Nạp danh mục tính năng tĩnh (SPEC-17 §2)
  entries.push(...getFeatureEntries());

  // 1. Nạp 25 bài học và từ vựng
  const lessonPromises = Array.from({ length: 25 }, (_, i) => i + 1).map(async (n) => {
    const [lesson, vocabList] = await Promise.all([loadLesson(n), loadVocab(n)]);
    return { lesson, vocabList };
  });

  const allLessonsData = await Promise.all(lessonPromises);

  for (const { lesson, vocabList } of allLessonsData) {
    const lessonNum = lesson.number;

    // A. Bài học
    entries.push({
      id: `lesson-${lessonNum}`,
      kind: 'lesson',
      label: `Bài ${lessonNum} — ${lesson.title.vi}`,
      sublabel: lesson.description.vi,
      lesson: lessonNum,
      badge: `Bài ${lessonNum}`,
      href: `/hoc/${lessonNum}`,
      keys: [
        `bai ${lessonNum}`,
        `bai ${lessonNum} ${normalizeSearchText(lesson.title.vi)}`,
        normalizeSearchText(lesson.title.vi),
        lesson.title.vi.toLowerCase(),
      ],
    });

    // B. Từ vựng (991 từ)
    for (const w of vocabList) {
      const plainWord = stripFurigana(w.word);
      const romaji = wanakana.toRomaji(w.kana);
      const viNorm = normalizeSearchText(w.meaning.vi);

      const keys = [
        plainWord.toLowerCase(),
        w.kana.toLowerCase(),
        romaji.toLowerCase(),
        viNorm,
        w.meaning.vi.toLowerCase(),
      ];

      if (w.verbForms) {
        const plainMasu = stripFurigana(w.verbForms.masu);
        const masuRomaji = wanakana.toRomaji(w.verbForms.masuKana);
        keys.push(
          plainMasu.toLowerCase(),
          w.verbForms.masuKana.toLowerCase(),
          masuRomaji.toLowerCase()
        );
      }

      const sublabel = w.verbForms
        ? `${w.meaning.vi} · Masu: ${stripFurigana(w.verbForms.masu)}`
        : w.meaning.vi;

      entries.push({
        id: `vocab-${String(lessonNum).padStart(2, '0')}-${w.id}`,
        kind: 'vocab',
        label: w.word,
        sublabel,
        lesson: lessonNum,
        badge: w.verbGroup ? `Bài ${lessonNum} · Nhóm ${w.verbGroup}` : `Bài ${lessonNum}`,
        href: `/hoc/${lessonNum}#vocab-${w.id}`,
        keys,
      });
    }

    // C. Ngữ pháp (141 điểm ngữ pháp)
    for (const g of lesson.grammar) {
      const patternPlain = stripFurigana(g.pattern.vi);
      const titleNorm = normalizeSearchText(g.title.vi);
      const patternNorm = normalizeSearchText(patternPlain);

      entries.push({
        id: `grammar-${String(lessonNum).padStart(2, '0')}-${g.id}`,
        kind: 'grammar',
        label: g.pattern.vi,
        sublabel: g.title.vi,
        lesson: lessonNum,
        badge: `Bài ${lessonNum}`,
        href: `/hoc/${lessonNum}#grammar-${g.id}`,
        keys: [
          titleNorm,
          g.title.vi.toLowerCase(),
          patternPlain.toLowerCase(),
          patternNorm,
          normalizeSearchText(g.explanation.vi),
        ],
      });
    }
  }

  // 2. Kanji (169 chữ)
  const allKanji = getAllKanji();
  for (const k of allKanji) {
    const viMeanings = k.meanings.vi;
    const viNorms = viMeanings.map((m) => normalizeSearchText(m));
    const onyomiHira = k.onyomi.map((o) => wanakana.toHiragana(o));
    const kunyomiRomaji = k.kunyomi.map((r) => wanakana.toRomaji(r));
    const onyomiRomaji = k.onyomi.map((r) => wanakana.toRomaji(r));

    entries.push({
      id: `kanji-${k.character}`,
      kind: 'kanji',
      label: k.character,
      sublabel: `${k.hanviet ? `${k.hanviet} · ` : ''}${viMeanings[0] ?? ''} · ${k.strokes} nét`,
      lesson: k.lesson,
      badge: `${k.strokes} nét`,
      href: `/hoc/tra-cuu/kanji/${encodeURIComponent(k.character)}`,
      keys: [
        k.character,
        ...(k.hanviet ? [normalizeSearchText(k.hanviet), k.hanviet.toLowerCase()] : []),
        ...viNorms,
        ...viMeanings.map((m) => m.toLowerCase()),
        ...k.onyomi.map((o) => o.toLowerCase()),
        ...k.kunyomi.map((ku) => ku.toLowerCase()),
        ...onyomiHira,
        ...kunyomiRomaji,
        ...onyomiRomaji,
      ],
    });
  }

  // 3. Động từ (156 động từ)
  const allVerbs = getAllVerbs();
  for (const v of allVerbs) {
    const plainVerb = stripFurigana(v.verb);
    const meaningNorm = normalizeSearchText(v.meaning.vi);
    const dictRomaji = wanakana.toRomaji(v.dictionary);

    entries.push({
      id: `verb-${v.id}`,
      kind: 'verb',
      label: v.verb,
      sublabel: `${v.masu} · ${v.meaning.vi}`,
      lesson: v.lesson,
      badge: `Nhóm ${v.group}`,
      href: `/hoc/tra-cuu/dong-tu?q=${encodeURIComponent(v.masu)}`,
      keys: [
        plainVerb.toLowerCase(),
        v.masu.toLowerCase(),
        v.dictionary.toLowerCase(),
        v.te.toLowerCase(),
        v.ta.toLowerCase(),
        v.nai?.toLowerCase() ?? '',
        dictRomaji.toLowerCase(),
        meaningNorm,
        v.meaning.vi.toLowerCase(),
        `nhom ${v.group}`,
      ],
    });
  }

  // 4. Bảng tham chiếu (10 bảng)
  const allTables = getAllReferenceDocs();
  for (const t of allTables) {
    entries.push({
      id: `table-${t.slug}`,
      kind: 'table',
      label: t.title.vi,
      sublabel: t.description.vi,
      badge: 'Tham chiếu',
      href: `/hoc/tra-cuu/bang/${t.slug}`,
      keys: [
        normalizeSearchText(t.title.vi),
        t.title.vi.toLowerCase(),
        t.title.en?.toLowerCase() ?? '',
        normalizeSearchText(t.description.vi),
        t.slug,
      ],
    });
  }

  cachedSearchIndex = entries;
  return entries;
}

/**
 * Thực thi tìm kiếm trên tập chỉ mục (SPEC-13 §2.3):
 * 1. Khớp cả bản chuẩn hóa và bản đã đổi sang kana bằng wanakana
 * 2. Xếp hạng 3 mức: chính xác > đầu chuỗi > chứa trong chuỗi
 * 3. Phân nhóm theo thứ tự cố định, tối đa 5 mục/nhóm, tối đa 20 mục tổng cộng
 */
export function executeSearch(
  entries: SearchEntry[],
  query: string
): { results: SearchEntry[]; totalMatches: number } {
  const trimmed = query.trim();
  if (!trimmed) {
    return { results: [], totalMatches: 0 };
  }

  const qRaw = trimmed.toLowerCase();
  const qNorm = normalizeSearchText(trimmed);
  const qKana = wanakana.toKana(qRaw);

  const tier1: SearchEntry[] = [];
  const tier2: SearchEntry[] = [];
  const tier3: SearchEntry[] = [];

  for (const entry of entries) {
    let rank = 0;

    for (const key of entry.keys) {
      if (!key) continue;

      // Tier 1: Khớp chính xác
      if (key === qNorm || key === qKana || key === qRaw) {
        rank = 1;
        break;
      }

      // Tier 2: Khớp đầu chuỗi
      if (
        (qNorm && key.startsWith(qNorm)) ||
        (qKana && key.startsWith(qKana)) ||
        key.startsWith(qRaw)
      ) {
        if (rank === 0 || rank > 2) rank = 2;
      }

      // Tier 3: Khớp chứa trong chuỗi
      // Đối với nhóm tính năng, bỏ qua substring matching khi query < 2 ký tự để tránh chiếm chỗ học liệu (SPEC-17)
      else if (
        !(entry.kind === 'feature' && trimmed.length < 2) &&
        ((qNorm && key.includes(qNorm)) ||
          (qKana && key.includes(qKana)) ||
          key.includes(qRaw))
      ) {
        if (rank === 0) rank = 3;
      }
    }

    if (rank === 1) tier1.push(entry);
    else if (rank === 2) tier2.push(entry);
    else if (rank === 3) tier3.push(entry);
  }

  const allMatched = [...tier1, ...tier2, ...tier3];
  const totalMatches = allMatched.length;

  // Gom nhóm theo thứ tự KIND_ORDER
  const grouped = new Map<SearchKind, SearchEntry[]>();
  for (const kind of KIND_ORDER) {
    grouped.set(kind, []);
  }

  for (const entry of allMatched) {
    const list = grouped.get(entry.kind);
    const limit = MAX_PER_GROUP[entry.kind] ?? 5;
    if (list && list.length < limit) {
      list.push(entry);
    }
  }

  // Ghép kết quả theo thứ tự nhóm cố định
  const results: SearchEntry[] = [];
  for (const kind of KIND_ORDER) {
    const items = grouped.get(kind) ?? [];
    for (const item of items) {
      if (results.length < 20) {
        results.push(item);
      }
    }
  }

  return { results, totalMatches };
}
