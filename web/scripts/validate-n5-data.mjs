import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve('../repo-reference/noken/src/data/n5');
const TARGET_DIR = path.resolve('src/data/n5');

const EXPECTED_COUNTS = {
  kanji: 169,
  lessons: 25,
  reference: 10,
  verbs: 1,
  vocab: 25,
};

// 8 empty layout cells allowed in reference
const ALLOWED_EMPTY_VI_CELLS = new Set([
  'reference/adjectives.json:sections[0].tables[0].headers[0]',
  'reference/calendar.json:sections[3].tables[0].headers[1]',
  'reference/calendar.json:sections[3].tables[0].headers[3]',
  'reference/calendar.json:sections[3].tables[0].headers[5]',
  'reference/calendar.json:sections[4].tables[0].headers[1]',
  'reference/calendar.json:sections[4].tables[0].headers[3]',
  'reference/calendar.json:sections[4].tables[0].headers[5]',
  'reference/demonstratives.json:sections[0].tables[0].headers[0]',
]);

function getFilesRecursively(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFilesRecursively(full));
    } else if (entry.name.endsWith('.json') && entry.name !== 'manifest.json') {
      files.push(full);
    }
  }
  return files;
}

describe('N5 Vietnamese Dataset Validation', () => {
  it('should have exactly 230 files across 5 subdirectories', () => {
    assert.ok(fs.existsSync(TARGET_DIR), `Target directory does not exist: ${TARGET_DIR}`);
    const files = getFilesRecursively(TARGET_DIR);
    assert.strictEqual(files.length, 230, `Expected 230 files, found ${files.length}`);

    const counts = { kanji: 0, lessons: 0, reference: 0, verbs: 0, vocab: 0 };
    for (const f of files) {
      const rel = path.relative(TARGET_DIR, f).replace(/\\/g, '/');
      const folder = rel.split('/')[0];
      if (folder in counts) {
        counts[folder]++;
      }
    }

    assert.deepStrictEqual(counts, EXPECTED_COUNTS, `File counts mismatch: ${JSON.stringify(counts)}`);
  });

  it('should be valid JSON and contain NO "es" keys anywhere', () => {
    const files = getFilesRecursively(TARGET_DIR);
    assert.strictEqual(files.length, 230, 'Target files must be present');
    const esLeaks = [];

    function checkNoEs(obj, filePath, keyPath = '') {
      if (Array.isArray(obj)) {
        obj.forEach((item, idx) => checkNoEs(item, filePath, `${keyPath}[${idx}]`));
      } else if (obj && typeof obj === 'object') {
        if ('es' in obj) {
          esLeaks.push(`${filePath}: ${keyPath}`);
        }
        for (const [k, v] of Object.entries(obj)) {
          checkNoEs(v, filePath, keyPath ? `${keyPath}.${k}` : k);
        }
      }
    }

    for (const file of files) {
      const rel = path.relative(TARGET_DIR, file).replace(/\\/g, '/');
      const content = fs.readFileSync(file, 'utf8');
      const data = JSON.parse(content);
      checkNoEs(data, rel);
    }

    assert.strictEqual(esLeaks.length, 0, `Found ${esLeaks.length} remaining "es" keys: ${esLeaks.slice(0, 10).join(', ')}`);
  });

  it('should have non-empty "vi" field for all localized elements', () => {
    const files = getFilesRecursively(TARGET_DIR);
    assert.strictEqual(files.length, 230, 'Target files must be present');
    const emptyViLeaks = [];

    function checkVi(obj, filePath, keyPath = '') {
      if (Array.isArray(obj)) {
        obj.forEach((item, idx) => checkVi(item, filePath, `${keyPath}[${idx}]`));
      } else if (obj && typeof obj === 'object') {
        if ('vi' in obj) {
          const fullKey = `${filePath}:${keyPath}`;
          if (typeof obj.vi === 'string') {
            if (obj.vi.trim() === '' && !ALLOWED_EMPTY_VI_CELLS.has(fullKey)) {
              emptyViLeaks.push(fullKey);
            }
          } else if (Array.isArray(obj.vi)) {
            if (obj.vi.length === 0 || obj.vi.some((s) => typeof s !== 'string' || s.trim() === '')) {
              emptyViLeaks.push(fullKey);
            }
          } else {
            emptyViLeaks.push(`${fullKey} (non-string/non-array)`);
          }
        }
        for (const [k, v] of Object.entries(obj)) {
          checkVi(v, filePath, keyPath ? `${keyPath}.${k}` : k);
        }
      }
    }

    for (const file of files) {
      const rel = path.relative(TARGET_DIR, file).replace(/\\/g, '/');
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      checkVi(data, rel);
    }

    assert.strictEqual(emptyViLeaks.length, 0, `Found empty "vi" fields: ${emptyViLeaks.slice(0, 10).join(', ')}`);
  });

  it('should preserve 100% of existing "en" fields from source', () => {
    const targetFiles = getFilesRecursively(TARGET_DIR);
    assert.strictEqual(targetFiles.length, 230, 'Target files must be present');
    const srcFiles = getFilesRecursively(SRC_DIR);
    const enMismatches = [];

    for (const srcFile of srcFiles) {
      const rel = path.relative(SRC_DIR, srcFile).replace(/\\/g, '/');
      const targetFile = path.join(TARGET_DIR, rel);
      if (!fs.existsSync(targetFile)) continue;

      const srcData = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
      const targetData = JSON.parse(fs.readFileSync(targetFile, 'utf8'));

      function compareEn(srcObj, targetObj, keyPath = '') {
        if (!srcObj || !targetObj) return;
        if (Array.isArray(srcObj) && Array.isArray(targetObj)) {
          srcObj.forEach((item, idx) => compareEn(item, targetObj[idx], `${keyPath}[${idx}]`));
        } else if (typeof srcObj === 'object' && typeof targetObj === 'object') {
          if ('en' in srcObj && srcObj.en !== undefined) {
            if (JSON.stringify(srcObj.en) !== JSON.stringify(targetObj.en)) {
              enMismatches.push(`${rel}:${keyPath} expected "${srcObj.en}" got "${targetObj.en}"`);
            }
          }
          for (const k of Object.keys(srcObj)) {
            if (k in targetObj) {
              compareEn(srcObj[k], targetObj[k], keyPath ? `${keyPath}.${k}` : k);
            }
          }
        }
      }

      compareEn(srcData, targetData);
    }

    assert.strictEqual(enMismatches.length, 0, `Found "en" mismatches: ${enMismatches.slice(0, 10).join(', ')}`);
  });

  it('should preserve IDs, Japanese text, Furigana and item counts 1:1 with source', () => {
    const targetFiles = getFilesRecursively(TARGET_DIR);
    assert.strictEqual(targetFiles.length, 230, 'Target files must be present');
    const srcFiles = getFilesRecursively(SRC_DIR);
    const parityErrors = [];

    for (const srcFile of srcFiles) {
      const rel = path.relative(SRC_DIR, srcFile).replace(/\\/g, '/');
      const targetFile = path.join(TARGET_DIR, rel);
      if (!fs.existsSync(targetFile)) continue;

      const srcData = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
      const targetData = JSON.parse(fs.readFileSync(targetFile, 'utf8'));

      if (rel.startsWith('vocab/')) {
        if (srcData.words.length !== targetData.words.length) {
          parityErrors.push(`${rel}: word count mismatch (${srcData.words.length} vs ${targetData.words.length})`);
        } else {
          srcData.words.forEach((w, i) => {
            const tw = targetData.words[i];
            if (w.id !== tw.id) parityErrors.push(`${rel}[${i}]: id mismatch ${w.id} vs ${tw.id}`);
            if (w.word !== tw.word) parityErrors.push(`${rel}[${i}]: word mismatch ${w.word} vs ${tw.word}`);
            if (w.kana !== tw.kana) parityErrors.push(`${rel}[${i}]: kana mismatch ${w.kana} vs ${tw.kana}`);
            if (w.type !== tw.type) parityErrors.push(`${rel}[${i}]: type mismatch ${w.type} vs ${tw.type}`);
          });
        }
      } else if (rel.startsWith('lessons/')) {
        if (srcData.grammar.length !== targetData.grammar.length) {
          parityErrors.push(`${rel}: grammar count mismatch (${srcData.grammar.length} vs ${targetData.grammar.length})`);
        } else {
          srcData.grammar.forEach((g, i) => {
            const tg = targetData.grammar[i];
            if (g.id !== tg.id) parityErrors.push(`${rel}[${i}]: grammar id mismatch ${g.id} vs ${tg.id}`);
            if (g.examples.length !== tg.examples.length) {
              parityErrors.push(`${rel}[${i}]: examples count mismatch`);
            } else {
              g.examples.forEach((ex, j) => {
                const tex = tg.examples[j];
                if (ex.jp !== tex.jp) parityErrors.push(`${rel}[${i}].ex[${j}]: jp mismatch`);
              });
            }
          });
        }
      } else if (rel.startsWith('kanji/')) {
        if (srcData.character !== targetData.character) parityErrors.push(`${rel}: character mismatch`);
        if (srcData.strokes !== targetData.strokes) parityErrors.push(`${rel}: strokes mismatch`);
        if (JSON.stringify(srcData.onyomi) !== JSON.stringify(targetData.onyomi)) parityErrors.push(`${rel}: onyomi mismatch`);
        if (JSON.stringify(srcData.kunyomi) !== JSON.stringify(targetData.kunyomi)) parityErrors.push(`${rel}: kunyomi mismatch`);
      } else if (rel.startsWith('verbs/')) {
        if (srcData.verbs.length !== targetData.verbs.length) {
          parityErrors.push(`${rel}: verbs count mismatch`);
        } else {
          srcData.verbs.forEach((v, i) => {
            const tv = targetData.verbs[i];
            if (v.id !== tv.id) parityErrors.push(`${rel}[${i}]: verb id mismatch`);
            if (v.group !== tv.group) parityErrors.push(`${rel}[${i}]: group mismatch`);
            if (v.masu !== tv.masu || v.te !== tv.te || v.dictionary !== tv.dictionary || v.nai !== tv.nai || v.ta !== tv.ta) {
              parityErrors.push(`${rel}[${i}]: conjugation mismatch`);
            }
          });
        }
      }
    }

    assert.strictEqual(parityErrors.length, 0, `Found parity errors: ${parityErrors.slice(0, 10).join(', ')}`);
  });

  it('should not contain leftover Spanish stop-words or placeholders in Vietnamese fields', () => {
    const files = getFilesRecursively(TARGET_DIR);
    assert.strictEqual(files.length, 230, 'Target files must be present');
    const suspiciousSpanish = [
      /\bde la\b/i,
      /\bdel hablante\b/i,
      /\bpara expresar\b/i,
      /\blugar donde\b/i,
      /\bforma cortés\b/i,
      /\bsustantivo\b/i,
      /\bverbo en forma\b/i,
      /\bcon el oyente\b/i,
    ];
    const placeholders = [/\bTODO\b/, /\bFIXME\b/, /\bTBD\b/, /\bundefined\b/];

    const violations = [];

    function checkClean(obj, filePath, keyPath = '') {
      if (Array.isArray(obj)) {
        obj.forEach((item, idx) => checkClean(item, filePath, `${keyPath}[${idx}]`));
      } else if (obj && typeof obj === 'object') {
        if ('vi' in obj) {
          const viVal = Array.isArray(obj.vi) ? obj.vi.join(' ') : String(obj.vi);
          for (const pattern of suspiciousSpanish) {
            if (pattern.test(viVal)) {
              violations.push(`${filePath}:${keyPath} matches Spanish pattern ${pattern}: "${viVal}"`);
            }
          }
          for (const pattern of placeholders) {
            if (pattern.test(viVal)) {
              violations.push(`${filePath}:${keyPath} matches placeholder pattern ${pattern}: "${viVal}"`);
            }
          }
        }
        for (const [k, v] of Object.entries(obj)) {
          checkClean(v, filePath, keyPath ? `${keyPath}.${k}` : k);
        }
      }
    }

    for (const file of files) {
      const rel = path.relative(TARGET_DIR, file).replace(/\\/g, '/');
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      checkClean(data, rel);
    }

    assert.strictEqual(violations.length, 0, `Found suspicious text in Vietnamese fields: ${violations.slice(0, 10).join(', ')}`);
  });
});
