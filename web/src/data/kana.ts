export type KanaType = 'hiragana' | 'katakana';

export interface KanaCell {
  kana: string;
  romaji: string;
  altRomaji?: string;
}

export interface KanaRow {
  name: string;
  label: string;
  cells: (KanaCell | null)[];
}

export const BASIC_COLUMN_HEADERS = ['a', 'i', 'u', 'e', 'o'] as const;
export const YOON_COLUMN_HEADERS = ['ya', 'yu', 'yo'] as const;

// ============================================================================
// 1. 46 ÂM CƠ BẢN (GOJŪON)
// ============================================================================

export const HIRAGANA_BASIC_ROWS: KanaRow[] = [
  {
    name: 'a',
    label: 'Hàng A',
    cells: [
      { kana: 'あ', romaji: 'a' },
      { kana: 'い', romaji: 'i' },
      { kana: 'う', romaji: 'u' },
      { kana: 'え', romaji: 'e' },
      { kana: 'お', romaji: 'o' },
    ],
  },
  {
    name: 'ka',
    label: 'Hàng Ka',
    cells: [
      { kana: 'か', romaji: 'ka' },
      { kana: 'き', romaji: 'ki' },
      { kana: 'く', romaji: 'ku' },
      { kana: 'け', romaji: 'ke' },
      { kana: 'こ', romaji: 'ko' },
    ],
  },
  {
    name: 'sa',
    label: 'Hàng Sa',
    cells: [
      { kana: 'さ', romaji: 'sa' },
      { kana: 'し', romaji: 'shi' },
      { kana: 'す', romaji: 'su' },
      { kana: 'せ', romaji: 'se' },
      { kana: 'そ', romaji: 'so' },
    ],
  },
  {
    name: 'ta',
    label: 'Hàng Ta',
    cells: [
      { kana: 'た', romaji: 'ta' },
      { kana: 'ち', romaji: 'chi' },
      { kana: 'つ', romaji: 'tsu' },
      { kana: 'て', romaji: 'te' },
      { kana: 'と', romaji: 'to' },
    ],
  },
  {
    name: 'na',
    label: 'Hàng Na',
    cells: [
      { kana: 'な', romaji: 'na' },
      { kana: 'に', romaji: 'ni' },
      { kana: 'ぬ', romaji: 'nu' },
      { kana: 'ね', romaji: 'ne' },
      { kana: 'の', romaji: 'no' },
    ],
  },
  {
    name: 'ha',
    label: 'Hàng Ha',
    cells: [
      { kana: 'は', romaji: 'ha' },
      { kana: 'ひ', romaji: 'hi' },
      { kana: 'ふ', romaji: 'fu' },
      { kana: 'へ', romaji: 'he' },
      { kana: 'ほ', romaji: 'ho' },
    ],
  },
  {
    name: 'ma',
    label: 'Hàng Ma',
    cells: [
      { kana: 'ま', romaji: 'ma' },
      { kana: 'み', romaji: 'mi' },
      { kana: 'む', romaji: 'mu' },
      { kana: 'め', romaji: 'me' },
      { kana: 'も', romaji: 'mo' },
    ],
  },
  {
    name: 'ya',
    label: 'Hàng Ya',
    cells: [
      { kana: 'や', romaji: 'ya' },
      null,
      { kana: 'ゆ', romaji: 'yu' },
      null,
      { kana: 'よ', romaji: 'yo' },
    ],
  },
  {
    name: 'ra',
    label: 'Hàng Ra',
    cells: [
      { kana: 'ら', romaji: 'ra' },
      { kana: 'り', romaji: 'ri' },
      { kana: 'る', romaji: 'ru' },
      { kana: 'れ', romaji: 're' },
      { kana: 'ろ', romaji: 'ro' },
    ],
  },
  {
    name: 'wa',
    label: 'Hàng Wa',
    cells: [
      { kana: 'わ', romaji: 'wa' },
      null,
      null,
      null,
      { kana: 'を', romaji: 'wo' },
    ],
  },
  {
    name: 'n',
    label: 'Âm mũi N',
    cells: [
      { kana: 'ん', romaji: 'n' },
      null,
      null,
      null,
      null,
    ],
  },
];

export const KATAKANA_BASIC_ROWS: KanaRow[] = [
  {
    name: 'a',
    label: 'Hàng A',
    cells: [
      { kana: 'ア', romaji: 'a' },
      { kana: 'イ', romaji: 'i' },
      { kana: 'ウ', romaji: 'u' },
      { kana: 'エ', romaji: 'e' },
      { kana: 'オ', romaji: 'o' },
    ],
  },
  {
    name: 'ka',
    label: 'Hàng Ka',
    cells: [
      { kana: 'カ', romaji: 'ka' },
      { kana: 'キ', romaji: 'ki' },
      { kana: 'ク', romaji: 'ku' },
      { kana: 'ケ', romaji: 'ke' },
      { kana: 'コ', romaji: 'ko' },
    ],
  },
  {
    name: 'sa',
    label: 'Hàng Sa',
    cells: [
      { kana: 'サ', romaji: 'sa' },
      { kana: 'シ', romaji: 'shi' },
      { kana: 'ス', romaji: 'su' },
      { kana: 'セ', romaji: 'se' },
      { kana: 'ソ', romaji: 'so' },
    ],
  },
  {
    name: 'ta',
    label: 'Hàng Ta',
    cells: [
      { kana: 'タ', romaji: 'ta' },
      { kana: 'チ', romaji: 'chi' },
      { kana: 'ツ', romaji: 'tsu' },
      { kana: 'テ', romaji: 'te' },
      { kana: 'ト', romaji: 'to' },
    ],
  },
  {
    name: 'na',
    label: 'Hàng Na',
    cells: [
      { kana: 'ナ', romaji: 'na' },
      { kana: 'ニ', romaji: 'ni' },
      { kana: 'ヌ', romaji: 'nu' },
      { kana: 'ネ', romaji: 'ne' },
      { kana: 'ノ', romaji: 'no' },
    ],
  },
  {
    name: 'ha',
    label: 'Hàng Ha',
    cells: [
      { kana: 'ハ', romaji: 'ha' },
      { kana: 'ヒ', romaji: 'hi' },
      { kana: 'フ', romaji: 'fu' },
      { kana: 'ヘ', romaji: 'he' },
      { kana: 'ホ', romaji: 'ho' },
    ],
  },
  {
    name: 'ma',
    label: 'Hàng Ma',
    cells: [
      { kana: 'マ', romaji: 'ma' },
      { kana: 'ミ', romaji: 'mi' },
      { kana: 'ム', romaji: 'mu' },
      { kana: 'メ', romaji: 'me' },
      { kana: 'モ', romaji: 'mo' },
    ],
  },
  {
    name: 'ya',
    label: 'Hàng Ya',
    cells: [
      { kana: 'ヤ', romaji: 'ya' },
      null,
      { kana: 'ユ', romaji: 'yu' },
      null,
      { kana: 'ヨ', romaji: 'yo' },
    ],
  },
  {
    name: 'ra',
    label: 'Hàng Ra',
    cells: [
      { kana: 'ラ', romaji: 'ra' },
      { kana: 'リ', romaji: 'ri' },
      { kana: 'ル', romaji: 'ru' },
      { kana: 'レ', romaji: 're' },
      { kana: 'ロ', romaji: 'ro' },
    ],
  },
  {
    name: 'wa',
    label: 'Hàng Wa',
    cells: [
      { kana: 'ワ', romaji: 'wa' },
      null,
      null,
      null,
      { kana: 'ヲ', romaji: 'wo' },
    ],
  },
  {
    name: 'n',
    label: 'Âm mũi N',
    cells: [
      { kana: 'ン', romaji: 'n' },
      null,
      null,
      null,
      null,
    ],
  },
];

// ============================================================================
// 2. ÂM ĐỤC & BÁN ĐỤC (DAKUON & HANDAKUON - 25 CHỮ)
// ============================================================================

export const HIRAGANA_DAKUON_ROWS: KanaRow[] = [
  {
    name: 'ga',
    label: 'Hàng Ga',
    cells: [
      { kana: 'が', romaji: 'ga' },
      { kana: 'ぎ', romaji: 'gi' },
      { kana: 'ぐ', romaji: 'gu' },
      { kana: 'げ', romaji: 'ge' },
      { kana: 'ご', romaji: 'go' },
    ],
  },
  {
    name: 'za',
    label: 'Hàng Za',
    cells: [
      { kana: 'ざ', romaji: 'za' },
      { kana: 'じ', romaji: 'ji' },
      { kana: 'ず', romaji: 'zu' },
      { kana: 'ぜ', romaji: 'ze' },
      { kana: 'ぞ', romaji: 'zo' },
    ],
  },
  {
    name: 'da',
    label: 'Hàng Da',
    cells: [
      { kana: 'だ', romaji: 'da' },
      { kana: 'ぢ', romaji: 'ji', altRomaji: 'di' },
      { kana: 'づ', romaji: 'zu', altRomaji: 'du' },
      { kana: 'で', romaji: 'de' },
      { kana: 'ど', romaji: 'do' },
    ],
  },
  {
    name: 'ba',
    label: 'Hàng Ba',
    cells: [
      { kana: 'ば', romaji: 'ba' },
      { kana: 'び', romaji: 'bi' },
      { kana: 'ぶ', romaji: 'bu' },
      { kana: 'べ', romaji: 'be' },
      { kana: 'ぼ', romaji: 'bo' },
    ],
  },
  {
    name: 'pa',
    label: 'Hàng Pa',
    cells: [
      { kana: 'ぱ', romaji: 'pa' },
      { kana: 'ぴ', romaji: 'pi' },
      { kana: 'ぷ', romaji: 'pu' },
      { kana: 'ぺ', romaji: 'pe' },
      { kana: 'ぽ', romaji: 'po' },
    ],
  },
];

export const KATAKANA_DAKUON_ROWS: KanaRow[] = [
  {
    name: 'ga',
    label: 'Hàng Ga',
    cells: [
      { kana: 'ガ', romaji: 'ga' },
      { kana: 'ギ', romaji: 'gi' },
      { kana: 'グ', romaji: 'gu' },
      { kana: 'ゲ', romaji: 'ge' },
      { kana: 'ゴ', romaji: 'go' },
    ],
  },
  {
    name: 'za',
    label: 'Hàng Za',
    cells: [
      { kana: 'ザ', romaji: 'za' },
      { kana: 'ジ', romaji: 'ji' },
      { kana: 'ズ', romaji: 'zu' },
      { kana: 'ゼ', romaji: 'ze' },
      { kana: 'ゾ', romaji: 'zo' },
    ],
  },
  {
    name: 'da',
    label: 'Hàng Da',
    cells: [
      { kana: 'ダ', romaji: 'da' },
      { kana: 'ヂ', romaji: 'ji', altRomaji: 'di' },
      { kana: 'ヅ', romaji: 'zu', altRomaji: 'du' },
      { kana: 'デ', romaji: 'de' },
      { kana: 'ド', romaji: 'do' },
    ],
  },
  {
    name: 'ba',
    label: 'Hàng Ba',
    cells: [
      { kana: 'バ', romaji: 'ba' },
      { kana: 'ビ', romaji: 'bi' },
      { kana: 'ブ', romaji: 'bu' },
      { kana: 'ベ', romaji: 'be' },
      { kana: 'ボ', romaji: 'bo' },
    ],
  },
  {
    name: 'pa',
    label: 'Hàng Pa',
    cells: [
      { kana: 'パ', romaji: 'pa' },
      { kana: 'ピ', romaji: 'pi' },
      { kana: 'プ', romaji: 'pu' },
      { kana: 'ペ', romaji: 'pe' },
      { kana: 'ポ', romaji: 'po' },
    ],
  },
];

// ============================================================================
// 3. ÂM GHÉP (YŌON - 33 CHỮ)
// ============================================================================

export const HIRAGANA_YOON_ROWS: KanaRow[] = [
  {
    name: 'kya',
    label: 'Hàng Kya',
    cells: [
      { kana: 'きゃ', romaji: 'kya' },
      { kana: 'きゅ', romaji: 'kyu' },
      { kana: 'きょ', romaji: 'kyo' },
    ],
  },
  {
    name: 'sha',
    label: 'Hàng Sha',
    cells: [
      { kana: 'しゃ', romaji: 'sha' },
      { kana: 'しゅ', romaji: 'shu' },
      { kana: 'しょ', romaji: 'sho' },
    ],
  },
  {
    name: 'cha',
    label: 'Hàng Cha',
    cells: [
      { kana: 'ちゃ', romaji: 'cha' },
      { kana: 'ちゅ', romaji: 'chu' },
      { kana: 'ちょ', romaji: 'cho' },
    ],
  },
  {
    name: 'nya',
    label: 'Hàng Nya',
    cells: [
      { kana: 'にゃ', romaji: 'nya' },
      { kana: 'にゅ', romaji: 'nyu' },
      { kana: 'にょ', romaji: 'nyo' },
    ],
  },
  {
    name: 'hya',
    label: 'Hàng Hya',
    cells: [
      { kana: 'ひゃ', romaji: 'hya' },
      { kana: 'ひゅ', romaji: 'hyu' },
      { kana: 'ひょ', romaji: 'hyo' },
    ],
  },
  {
    name: 'mya',
    label: 'Hàng Mya',
    cells: [
      { kana: 'みゃ', romaji: 'mya' },
      { kana: 'みゅ', romaji: 'myu' },
      { kana: 'みょ', romaji: 'myo' },
    ],
  },
  {
    name: 'rya',
    label: 'Hàng Rya',
    cells: [
      { kana: 'りゃ', romaji: 'rya' },
      { kana: 'りゅ', romaji: 'ryu' },
      { kana: 'りょ', romaji: 'ryo' },
    ],
  },
  {
    name: 'gya',
    label: 'Hàng Gya',
    cells: [
      { kana: 'ぎゃ', romaji: 'gya' },
      { kana: 'ぎゅ', romaji: 'gyu' },
      { kana: 'ぎょ', romaji: 'gyo' },
    ],
  },
  {
    name: 'ja',
    label: 'Hàng Ja',
    cells: [
      { kana: 'じゃ', romaji: 'ja' },
      { kana: 'じゅ', romaji: 'ju' },
      { kana: 'じょ', romaji: 'jo' },
    ],
  },
  {
    name: 'bya',
    label: 'Hàng Bya',
    cells: [
      { kana: 'びゃ', romaji: 'bya' },
      { kana: 'びゅ', romaji: 'byu' },
      { kana: 'びょ', romaji: 'byo' },
    ],
  },
  {
    name: 'pya',
    label: 'Hàng Pya',
    cells: [
      { kana: 'ぴゃ', romaji: 'pya' },
      { kana: 'ぴゅ', romaji: 'pyu' },
      { kana: 'ぴょ', romaji: 'pyo' },
    ],
  },
];

export const KATAKANA_YOON_ROWS: KanaRow[] = [
  {
    name: 'kya',
    label: 'Hàng Kya',
    cells: [
      { kana: 'キャ', romaji: 'kya' },
      { kana: 'キュ', romaji: 'kyu' },
      { kana: 'キョ', romaji: 'kyo' },
    ],
  },
  {
    name: 'sha',
    label: 'Hàng Sha',
    cells: [
      { kana: 'シャ', romaji: 'sha' },
      { kana: 'シュ', romaji: 'shu' },
      { kana: 'ショ', romaji: 'sho' },
    ],
  },
  {
    name: 'cha',
    label: 'Hàng Cha',
    cells: [
      { kana: 'チャ', romaji: 'cha' },
      { kana: 'チュ', romaji: 'chu' },
      { kana: 'チョ', romaji: 'cho' },
    ],
  },
  {
    name: 'nya',
    label: 'Hàng Nya',
    cells: [
      { kana: 'ニャ', romaji: 'nya' },
      { kana: 'ニュ', romaji: 'nyu' },
      { kana: 'ニョ', romaji: 'nyo' },
    ],
  },
  {
    name: 'hya',
    label: 'Hàng Hya',
    cells: [
      { kana: 'ヒャ', romaji: 'hya' },
      { kana: 'ヒュ', romaji: 'hyu' },
      { kana: 'ヒョ', romaji: 'hyo' },
    ],
  },
  {
    name: 'mya',
    label: 'Hàng Mya',
    cells: [
      { kana: 'ミャ', romaji: 'mya' },
      { kana: 'ミュ', romaji: 'myu' },
      { kana: 'ミョ', romaji: 'myo' },
    ],
  },
  {
    name: 'rya',
    label: 'Hàng Rya',
    cells: [
      { kana: 'リャ', romaji: 'rya' },
      { kana: 'リュ', romaji: 'ryu' },
      { kana: 'リョ', romaji: 'ryo' },
    ],
  },
  {
    name: 'gya',
    label: 'Hàng Gya',
    cells: [
      { kana: 'ギャ', romaji: 'gya' },
      { kana: 'ギュ', romaji: 'gyu' },
      { kana: 'ギョ', romaji: 'gyo' },
    ],
  },
  {
    name: 'ja',
    label: 'Hàng Ja',
    cells: [
      { kana: 'ジャ', romaji: 'ja' },
      { kana: 'ジュ', romaji: 'ju' },
      { kana: 'ジョ', romaji: 'jo' },
    ],
  },
  {
    name: 'bya',
    label: 'Hàng Bya',
    cells: [
      { kana: 'ビャ', romaji: 'bya' },
      { kana: 'ビュ', romaji: 'byu' },
      { kana: 'ビョ', romaji: 'byo' },
    ],
  },
  {
    name: 'pya',
    label: 'Hàng Pya',
    cells: [
      { kana: 'ピャ', romaji: 'pya' },
      { kana: 'ピュ', romaji: 'pyu' },
      { kana: 'ピョ', romaji: 'pyo' },
    ],
  },
];

// ============================================================================
// CÁC HÀM TIỆN ÍCH & TRÍCH XUẤT THUẦN
// ============================================================================

/**
 * Trích xuất danh sách phẳng các ô Kana hợp lệ (bỏ qua các vị trí null) từ danh sách hàng.
 */
export function flattenKanaRows(rows: KanaRow[]): KanaCell[] {
  const result: KanaCell[] = [];
  for (const r of rows) {
    for (const cell of r.cells) {
      if (cell !== null) {
        result.push(cell);
      }
    }
  }
  return result;
}

/**
 * Lấy danh sách 46 âm cơ bản dạng mảng phẳng theo loại Kana.
 */
export function getBasicKana(type: KanaType): KanaCell[] {
  return flattenKanaRows(type === 'hiragana' ? HIRAGANA_BASIC_ROWS : KATAKANA_BASIC_ROWS);
}

/**
 * Lấy danh sách 25 âm đục/bán đục dạng mảng phẳng theo loại Kana.
 */
export function getDakuonKana(type: KanaType): KanaCell[] {
  return flattenKanaRows(type === 'hiragana' ? HIRAGANA_DAKUON_ROWS : KATAKANA_DAKUON_ROWS);
}

/**
 * Lấy danh sách 33 âm ghép dạng mảng phẳng theo loại Kana.
 */
export function getYoonKana(type: KanaType): KanaCell[] {
  return flattenKanaRows(type === 'hiragana' ? HIRAGANA_YOON_ROWS : KATAKANA_YOON_ROWS);
}

/**
 * Lấy cấu trúc bảng hoàn chỉnh gồm 3 nhóm (Cơ bản, Âm đục, Âm ghép) theo loại Kana.
 */
export function getKanaGroups(type: KanaType) {
  const isHira = type === 'hiragana';
  return [
    {
      id: 'basic',
      title: isHira ? 'Bảng Hiragana 46 âm cơ bản' : 'Bảng Katakana 46 âm cơ bản',
      subtitle: isHira
        ? 'Bảng chữ mềm chính yếu — nên học thuộc trước khi bắt đầu bài 1.'
        : 'Bảng chữ cứng dùng cho từ mượn tiếng nước ngoài và tên riêng.',
      columns: BASIC_COLUMN_HEADERS,
      rows: isHira ? HIRAGANA_BASIC_ROWS : KATAKANA_BASIC_ROWS,
    },
    {
      id: 'dakuon',
      title: 'Âm đục & bán đục (Biến âm)',
      subtitle: 'Thêm dấu tenten (゛) hoặc maru (゜) để biến đổi phụ âm đầu.',
      columns: BASIC_COLUMN_HEADERS,
      rows: isHira ? HIRAGANA_DAKUON_ROWS : KATAKANA_DAKUON_ROWS,
    },
    {
      id: 'yoon',
      title: 'Âm ghép (Ảo âm)',
      subtitle: 'Kết hợp âm hàng i với ya, yu, yo viết nhỏ.',
      columns: YOON_COLUMN_HEADERS,
      rows: isHira ? HIRAGANA_YOON_ROWS : KATAKANA_YOON_ROWS,
    },
  ];
}
