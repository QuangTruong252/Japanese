import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const VERBS_PATH = path.join(ROOT, 'web/src/data/n5/verbs/verbs.json');
const VOCAB_DIR = path.join(ROOT, 'web/src/data/n5/vocab');

const verbsData = JSON.parse(fs.readFileSync(VERBS_PATH, 'utf8'));

function splitVerbAndContext(word) {
  if (!word.endsWith('〜]')) return { base: word, context: '' };
  let depth = 0;
  for (let i = word.length - 1; i >= 0; i--) {
    if (word[i] === ']') depth++;
    else if (word[i] === '[') {
      depth--;
      if (depth === 0) return { base: word.slice(0, i), context: word.slice(i) };
    }
  }
  return { base: word, context: '' };
}

const lookup = new Map();
for (const v of verbsData.verbs) {
  lookup.set(v.masu + '_' + v.lesson, v);
  if (!lookup.has(v.masu)) lookup.set(v.masu, v);
}

const manualOverrides = {
  'irasshaimasu': {
    group: 1,
    dictionary: 'いらっしゃる',
    dictionaryKana: 'いらっしゃる',
    masu: 'いらっしゃいます',
    masuKana: 'いらっしゃいます',
    te: 'いらっしゃって',
    teKana: 'いらっしゃって',
    nai: 'いらっしゃらない',
    naiKana: 'いらっしゃらない',
    ta: 'いらっしゃった',
    taKana: 'いらっしゃった',
  },
  'toshi-o-torimasu': {
    group: 1,
    dictionary: '取[と]る[年[とし]を〜]',
    dictionaryKana: 'としをとる',
    masu: '取[と]ります[年[とし]を〜]',
    masuKana: 'としをとります',
    te: '取[と]って[年[とし]を〜]',
    teKana: 'としをとって',
    nai: '取[と]らない[年[とし]を〜]',
    naiKana: 'としをとらない',
    ta: '取[と]った[年[とし]を〜]',
    taKana: 'としをとった',
  },
};

let enrichedCount = 0;

for (let i = 1; i <= 25; i++) {
  const pad = String(i).padStart(2, '0');
  const filePath = path.join(VOCAB_DIR, `lesson-${pad}.json`);
  if (!fs.existsSync(filePath)) continue;

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let modified = false;

  for (const w of data.words) {
    if (!w.type || !w.type.startsWith('verb-')) continue;

    let group = 1;
    if (w.type === 'verb-godan') group = 1;
    else if (w.type === 'verb-ichidan') group = 2;
    else if (w.type === 'verb-irregular') group = 3;

    let verbForms;
    let dictWord;
    let dictKana;

    if (manualOverrides[w.id]) {
      const mo = manualOverrides[w.id];
      group = mo.group;
      dictWord = mo.dictionary;
      dictKana = mo.dictionaryKana;
      verbForms = {
        dictionary: mo.dictionary,
        dictionaryKana: mo.dictionaryKana,
        masu: mo.masu,
        masuKana: mo.masuKana,
        te: mo.te,
        teKana: mo.teKana,
        nai: mo.nai,
        naiKana: mo.naiKana,
        ta: mo.ta,
        taKana: mo.taKana,
      };
    } else {
      const v = lookup.get(w.kana + '_' + i) || lookup.get(w.kana);
      if (!v) {
        throw new Error(`Cannot find lookup for verb: ${w.id} (${w.kana}) in lesson ${i}`);
      }

      const { base: baseWord, context } = splitVerbAndContext(w.word);
      let teWord;
      let naiWord;
      let taWord;

      dictKana = v.dictionary;
      const masuKana = v.masu;
      const teKana = v.te;
      const naiKana = v.nai || '';
      const taKana = v.ta;

      if (group === 3) {
        if (baseWord.endsWith('します')) {
          const stem = baseWord.slice(0, -3);
          dictWord = stem + 'する' + context;
          teWord = stem + 'して' + context;
          naiWord = stem + 'しない' + context;
          taWord = stem + 'した' + context;
        } else if (baseWord === '来[き]ます') {
          dictWord = '来[く]る' + context;
          teWord = '来[き]て' + context;
          naiWord = '来[こ]ない' + context;
          taWord = '来[き]た' + context;
        } else if (baseWord.endsWith('来[き]ます')) {
          const prefix = baseWord.slice(0, -'来[き]ます'.length);
          dictWord = prefix + '来[く]る' + context;
          teWord = prefix + '来[き]て' + context;
          naiWord = prefix + '来[こ]ない' + context;
          taWord = prefix + '来[き]た' + context;
        } else {
          dictWord = v.dictionary + context;
          teWord = v.te + context;
          naiWord = (v.nai || '') + context;
          taWord = v.ta + context;
        }
      } else if (group === 2) {
        const stem = baseWord.slice(0, -2);
        dictWord = stem + 'る' + context;
        teWord = stem + (v.te.endsWith('で') ? 'で' : 'て') + context;
        naiWord = stem + 'ない' + context;
        taWord = stem + (v.ta.endsWith('だ') ? 'だ' : 'た') + context;
      } else {
        // Godan
        const masuStemKana = v.masu.slice(0, -2);
        const tailKana = masuStemKana.slice(-1);
        if (baseWord.endsWith(tailKana + 'ます')) {
          const stem = baseWord.slice(0, -(tailKana.length + 2));
          const dictEnding = v.dictionary.slice(masuStemKana.length - 1);
          const teEnding = v.te.slice(masuStemKana.length - 1);
          const naiEnding = v.nai ? v.nai.slice(masuStemKana.length - 1) : '';
          const taEnding = v.ta.slice(masuStemKana.length - 1);
          dictWord = stem + dictEnding + context;
          teWord = stem + teEnding + context;
          naiWord = naiEnding ? stem + naiEnding + context : undefined;
          taWord = stem + taEnding + context;
        } else if (baseWord.endsWith('ます')) {
          const stem = baseWord.slice(0, -2);
          dictWord = stem + context;
          teWord = stem + context;
          taWord = stem + context;
        }
      }

      verbForms = {
        dictionary: dictWord,
        dictionaryKana: dictKana,
        masu: w.word,
        masuKana: w.kana,
        te: teWord,
        teKana,
        nai: naiWord,
        naiKana,
        ta: taWord,
        taKana,
      };
    }

    w.word = dictWord;
    w.kana = dictKana;
    w.verbGroup = group;
    w.verbForms = verbForms;
    modified = true;
    enrichedCount++;
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  }
}

console.log(`Successfully enriched ${enrichedCount} verbs across N5 lessons.`);
