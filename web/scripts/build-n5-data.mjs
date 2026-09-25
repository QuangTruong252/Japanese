import fs from 'node:fs';
import path from 'node:path';

import { VERB_VI_MEANINGS } from './data-dicts/n5-verbs-dict.mjs';
import { KANJI_SINO_VIET } from './data-dicts/n5-kanji-dict.mjs';
import { KANJI_EXAMPLES_VI } from './data-dicts/n5-kanji-examples-dict.mjs';
import { VOCAB_VI_DICT } from './data-dicts/n5-vocab-dict.mjs';
import { LESSON_META, LESSON_GRAMMAR } from './data-dicts/n5-lessons-dict.mjs';
import { REFERENCE_DICT } from './data-dicts/n5-reference-dict.mjs';

const SRC_DIR = path.resolve('../repo-reference/noken/src/data/n5');
const TARGET_DIR = path.resolve('src/data/n5');

console.log(`Source directory: ${SRC_DIR}`);
console.log(`Target directory: ${TARGET_DIR}`);

// Ensure target directories exist
const SUBDIRS = ['verbs', 'kanji', 'vocab', 'lessons', 'reference'];
for (const sub of SUBDIRS) {
  fs.mkdirSync(path.join(TARGET_DIR, sub), { recursive: true });
}

let totalGenerated = 0;

const targets = process.argv.slice(2);
const shouldRun = (sub) => targets.length === 0 || targets.includes(sub);

// 1. VERBS (1 file)
if (shouldRun('verbs')) {
  const srcPath = path.join(SRC_DIR, 'verbs/verbs.json');
  const targetPath = path.join(TARGET_DIR, 'verbs/verbs.json');
  const data = JSON.parse(fs.readFileSync(srcPath, 'utf8'));

  for (const v of data.verbs) {
    const vi = VERB_VI_MEANINGS[v.id];
    if (!vi) {
      throw new Error(`Missing Vietnamese translation for verb ${v.id}`);
    }
    v.meaning.vi = vi;
    delete v.meaning.es;
  }

  fs.writeFileSync(targetPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  totalGenerated++;
  console.log(`Generated verbs: verbs.json (156 verbs)`);
}

// 2. KANJI (169 files)
if (shouldRun('kanji')) {
  const kanjiSrcDir = path.join(SRC_DIR, 'kanji');
  const kanjiTargetDir = path.join(TARGET_DIR, 'kanji');
  const files = fs.readdirSync(kanjiSrcDir).filter((f) => f.endsWith('.json')).sort();

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(kanjiSrcDir, file), 'utf8'));
    const kanjiInfo = KANJI_SINO_VIET[data.character];
    if (!kanjiInfo) {
      throw new Error(`Missing kanji info for character: ${data.character}`);
    }

    data.meanings.vi = kanjiInfo.meanings;
    delete data.meanings.es;

    for (const ex of (data.examples || [])) {
      const exVi = KANJI_EXAMPLES_VI[ex.word];
      if (!exVi) {
        throw new Error(`Missing translation for kanji example: ${ex.word} in ${file}`);
      }
      ex.meaning.vi = exVi;
      delete ex.meaning.es;
    }

    fs.writeFileSync(path.join(kanjiTargetDir, file), JSON.stringify(data, null, 2) + '\n', 'utf8');
    totalGenerated++;
  }
  console.log(`Generated kanji: ${files.length} files`);
}

// 3. VOCAB (25 files)
if (shouldRun('vocab')) {
  const vocabSrcDir = path.join(SRC_DIR, 'vocab');
  const vocabTargetDir = path.join(TARGET_DIR, 'vocab');
  const files = fs.readdirSync(vocabSrcDir).filter((f) => f.endsWith('.json')).sort();

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(vocabSrcDir, file), 'utf8'));
    const lessonNum = parseInt(file.replace('lesson-', '').replace('.json', ''), 10);

    for (const w of data.words) {
      const key = `${lessonNum}:${w.id}`;
      const vi = VOCAB_VI_DICT[key];
      if (!vi) {
        throw new Error(`Missing vocabulary translation for ${key} in ${file}`);
      }
      w.meaning.vi = vi;
      delete w.meaning.es;
    }

    fs.writeFileSync(path.join(vocabTargetDir, file), JSON.stringify(data, null, 2) + '\n', 'utf8');
    totalGenerated++;
  }
  console.log(`Generated vocab: ${files.length} files`);
}

// 4. LESSONS (25 files)
if (shouldRun('lessons')) {
  const lessonsSrcDir = path.join(SRC_DIR, 'lessons');
  const lessonsTargetDir = path.join(TARGET_DIR, 'lessons');
  const files = fs.readdirSync(lessonsSrcDir).filter((f) => f.endsWith('.json')).sort();

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(lessonsSrcDir, file), 'utf8'));
    const lessonNum = data.number;

    const meta = LESSON_META[lessonNum];
    if (!meta) {
      throw new Error(`Missing lesson meta for lesson ${lessonNum}`);
    }

    data.title.vi = meta.title;
    delete data.title.es;

    data.description.vi = meta.description;
    delete data.description.es;

    for (const g of data.grammar) {
      const key = `${lessonNum}:${g.id}`;
      const trans = LESSON_GRAMMAR[key];
      if (!trans) {
        throw new Error(`Missing translation for grammar ${key} in ${file}`);
      }

      g.title.vi = trans.title;
      delete g.title.es;

      g.pattern.vi = trans.pattern;
      delete g.pattern.es;

      g.explanation.vi = trans.explanation;
      delete g.explanation.es;

      if (g.examples) {
        g.examples.forEach((ex, idx) => {
          const exTrans = trans.examples[idx];
          if (!exTrans) {
            throw new Error(`Missing example translation for ${key}[${idx}] in ${file}`);
          }
          ex.translation.vi = exTrans.translation;
          delete ex.translation.es;

          if (ex.note) {
            if (lessonNum === 9 && g.id === 'ga-objeto' && idx === 2) {
              ex.note.vi = "上手／下手 dùng để nói về năng lực, sở trường; còn 好き dùng để nói về sở thích.";
            } else if (exTrans.note) {
              ex.note.vi = exTrans.note;
            }
            delete ex.note.es;
          }
        });
      }
    }

    fs.writeFileSync(path.join(lessonsTargetDir, file), JSON.stringify(data, null, 2) + '\n', 'utf8');
    totalGenerated++;
  }
  console.log(`Generated lessons: ${files.length} files`);
}

// 5. REFERENCE (10 files)
if (shouldRun('reference')) {
  const refSrcDir = path.join(SRC_DIR, 'reference');
  const refTargetDir = path.join(TARGET_DIR, 'reference');
  const files = fs.readdirSync(refSrcDir).filter((f) => f.endsWith('.json')).sort();

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(refSrcDir, file), 'utf8'));

    function walk(obj, p = '') {
      if (!obj || typeof obj !== 'object') return;
      if (obj.es !== undefined) {
        const key = `${file}:::${p}`;
        const vi = REFERENCE_DICT[key];
        if (vi === undefined) {
          throw new Error(`Missing reference translation for ${key}`);
        }
        obj.vi = vi;
        delete obj.es;
        return;
      }
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'object') {
          walk(v, p ? `${p}.${k}` : k);
        }
      }
    }

    walk(data);

    fs.writeFileSync(path.join(refTargetDir, file), JSON.stringify(data, null, 2) + '\n', 'utf8');
    totalGenerated++;
  }
  console.log(`Generated reference: ${files.length} files`);
}

console.log(`\nAll done! Generated exactly ${totalGenerated} files in ${TARGET_DIR}`);
