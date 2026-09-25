import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAndValidateManifest, parseAudioTrackPath } from './audio-zip.ts';
import {
  SAMPLE_MANIFEST_JSON,
  SAMPLE_MANIFEST_RECORD,
  MANIFEST_FIELD_DOCS,
} from './audio-manifest-sample.ts';

test('audio manifest sample parses and validates with parseAndValidateManifest', () => {
  const result = parseAndValidateManifest(SAMPLE_MANIFEST_JSON);
  assert.equal(result.valid, true, `Validator error: ${result.error}`);
  assert.ok(result.manifest, 'Manifest object should be defined');
  assert.equal(Object.keys(result.manifest).length, 2);
  assert.deepEqual(result.manifest, SAMPLE_MANIFEST_RECORD);
});

test('audio manifest sample keys match audio-zip track path format', () => {
  for (const trackPath of Object.keys(SAMPLE_MANIFEST_RECORD)) {
    const parsed = parseAudioTrackPath(trackPath);
    assert.ok(parsed !== null, `Key "${trackPath}" should be a valid audio track path`);
    assert.equal(parsed?.lesson, 1);
    assert.ok(parsed?.trackNumber >= 1 && parsed?.trackNumber <= 4);
    assert.ok(['vocab', 'sentence_patterns', 'examples', 'conversation'].includes(parsed?.type));
  }
});

test('audio manifest field documentation is non-empty', () => {
  assert.ok(MANIFEST_FIELD_DOCS.length >= 2);
  for (const doc of MANIFEST_FIELD_DOCS) {
    assert.ok(doc.name.length > 0);
    assert.ok(doc.description.length > 0);
  }
});
