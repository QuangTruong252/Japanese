import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRoleAvatar } from './characters.ts';
import charactersData from '../data/n5/characters.json' with { type: 'json' };
import readingData from '../data/n5/reading.json' with { type: 'json' };
import { validateIllustrationAsset } from './illustrations.ts';
import { AVAILABLE_N5_LESSONS, loadLesson } from './lessons.ts';

const cast = charactersData as Record<string, { name?: string; kind?: string; roleVi?: string; bioVi?: string; canon?: string[]; avatar?: unknown }>;

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
  assert.equal(getRoleAvatar(''), undefined);
});

test('nhân vật chính có hồ sơ đầy đủ; vai phụ có mô tả vai', () => {
  for (const [id, c] of Object.entries(cast)) {
    assert.match(id, /^[a-z]+(?:-[a-z]+)*$/u, `${id}: id phải là romaji thường, nối bằng "-"`);
    assert.ok(c.name?.trim(), `${id}: thiếu name`);
    assert.ok(c.kind === 'main' || c.kind === 'extra', `${id}: kind phải là main hoặc extra`);
    assert.ok(c.roleVi?.trim(), `${id}: thiếu roleVi`);
    if (c.kind === 'main') {
      assert.ok(c.bioVi?.trim(), `${id}: nhân vật chính thiếu bioVi`);
      assert.ok(c.canon?.length && c.canon.every((f) => f.trim()), `${id}: nhân vật chính thiếu canon`);
    }
  }
});

// Danh sách nhân vật là nguồn chung cho hồ sơ hiển thị và cho người soạn bài mới, nên mọi vai
// xuất hiện trong nội dung phải được đăng ký và giữ đúng một cách viết tên.
test('mọi vai trong hội thoại bài học và Luyện đọc đều có trong characters.json, cùng tên', async () => {
  const roles: { where: string; id: string; name: string }[] = [];
  for (const lesson of AVAILABLE_N5_LESSONS) {
    for (const d of (await loadLesson(lesson)).dialogues ?? []) {
      for (const r of d.roles) roles.push({ where: `bài ${lesson} ${d.id}`, ...r });
    }
  }
  for (const p of readingData.passages as { id: string; roles?: { id: string; name: string }[] }[]) {
    for (const r of p.roles ?? []) roles.push({ where: `Luyện đọc ${p.id}`, ...r });
  }
  assert.ok(roles.length > 0);
  for (const { where, id, name } of roles) {
    assert.ok(cast[id], `${where}: vai "${id}" chưa đăng ký trong characters.json`);
    assert.equal(name, cast[id].name, `${where}: tên vai "${id}" khác characters.json`);
  }
});
