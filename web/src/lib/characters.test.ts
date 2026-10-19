import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRoleAvatar } from './characters.ts';
import charactersData from '../data/n5/characters.json' with { type: 'json' };
import { validateIllustrationAsset } from './illustrations.ts';

test('mọi entry trong characters.json đều có avatar hợp lệ', () => {
  for (const [roleId, entry] of Object.entries(charactersData)) {
    assert.ok(entry && typeof entry === 'object', `Entry của ${roleId} phải là object`);
    const char = entry as { avatar?: unknown };
    assert.ok(char.avatar, `Nhân vật ${roleId} phải có trường avatar`);
    assert.doesNotThrow(() => validateIllustrationAsset(char.avatar), `Avatar của ${roleId} phải thỏa mãn validateIllustrationAsset`);
    assert.equal(getRoleAvatar(roleId), char.avatar);
  }
});

test('roleId không có trong dữ liệu trả về undefined', () => {
  assert.equal(getRoleAvatar('non-existent-role'), undefined);
  assert.equal(getRoleAvatar('mai'), undefined);
  assert.equal(getRoleAvatar('tanaka'), undefined);
  assert.equal(getRoleAvatar(''), undefined);
});
