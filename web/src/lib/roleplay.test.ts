import test from 'node:test';
import assert from 'node:assert/strict';
import { createRolePlay, rolePlayView, stepRolePlay } from './roleplay.ts';
import type { Dialogue } from '../types/index.ts';
import { loadLesson } from './lessons.ts';

const { dialogues = [] } = await loadLesson(1);
const source = dialogues[0]!;
// Dùng nguyên câu và tên trong dữ liệu bài học, chỉ sắp thứ tự người nói để kiểm đường đi.
const dialogue: Dialogue = {
  ...source,
  roles: [...source.roles, { ...source.roles[0]!, id: 'third' }],
  lines: ['mai', source.roles.find((role) => role.id !== 'mai')!.id, 'third', 'mai'].map(
    (speaker, index) => ({ ...source.lines[index % source.lines.length]!, speaker }),
  ),
};

test('hiện câu của mình rồi tự hiện các vai khác, dừng ở lượt mình tiếp theo', () => {
  let state = createRolePlay(dialogue);
  assert.equal(state.roleId, 'mai');
  assert.equal(rolePlayView(dialogue, state).visibleLines.length, 0);
  state = stepRolePlay(dialogue, state, { type: 'start' });
  let view = rolePlayView(dialogue, state);
  assert.equal(view.progress, '1/4');
  assert.equal(view.isOwnTurn, true);
  assert.equal(view.buttonLabel, 'Hiện câu');
  assert.equal(view.visibleLines[0]!.hidden, true);
  const beforeReveal = state;
  state = stepRolePlay(dialogue, state, { type: 'next' });
  assert.equal(rolePlayView(dialogue, beforeReveal).buttonLabel, 'Hiện câu');
  view = rolePlayView(dialogue, state);
  assert.equal(view.progress, '4/4');
  assert.equal(view.buttonLabel, 'Hiện câu');
  assert.equal(rolePlayView(dialogue, state).visibleLines[0]!.hidden, false);
  assert.ok(view.visibleLines.slice(0, 3).every((item) => !item.hidden));
  assert.deepEqual([view.speechStart, view.speechEnd], [1, 3]);
  assert.equal(rolePlayView(dialogue, state).visibleLines[3]!.hidden, true);
  state = stepRolePlay(dialogue, state, { type: 'next' });
  assert.equal(state.phase, 'session');
  assert.equal(rolePlayView(dialogue, state).progress, '4/4');
  assert.equal(rolePlayView(dialogue, state).buttonLabel, 'Hoàn tất');
  assert.ok(rolePlayView(dialogue, state).visibleLines.every((item) => !item.hidden));
  state = stepRolePlay(dialogue, state, { type: 'next' });
  assert.equal(state.phase, 'done');
  assert.equal(rolePlayView(dialogue, state).progress, '4/4');
  assert.deepEqual(stepRolePlay(dialogue, state, { type: 'next' }), state);
  state = stepRolePlay(dialogue, state, { type: 'change-role' });
  assert.equal(state.phase, 'pick');
  assert.equal(rolePlayView(dialogue, state).visibleLines.length, 0);
  state = stepRolePlay(dialogue, state, { type: 'select', roleId: 'third' });
  state = stepRolePlay(dialogue, state, { type: 'start' });
  view = rolePlayView(dialogue, state);
  assert.equal(view.isOwnTurn, true);
  assert.equal(view.progress, '3/4');
  assert.equal(view.visibleLines[2]!.hidden, true);
  assert.deepEqual([view.speechStart, view.speechEnd], [0, 2]);
  state = stepRolePlay(dialogue, state, { type: 'next' });
  view = rolePlayView(dialogue, state);
  assert.equal(view.buttonLabel, 'Hoàn tất');
  assert.equal(view.visibleLines.length, 4);
  assert.deepEqual([view.speechStart, view.speechEnd], [3, 4]);
});

test('hai câu của mình liên tiếp vẫn cần Hiện câu riêng; vai không có câu vẫn đọc được đoạn', () => {
  const ownOnly = { ...dialogue, lines: dialogue.lines.filter((line) => line.speaker === 'mai') };
  let state = stepRolePlay(ownOnly, createRolePlay(ownOnly), { type: 'start' });
  state = stepRolePlay(ownOnly, state, { type: 'next' });
  const view = rolePlayView(ownOnly, state);
  assert.equal(view.visibleLines.length, 2);
  assert.equal(view.visibleLines[0]!.hidden, false);
  assert.equal(view.visibleLines[1]!.hidden, true);
  assert.equal(view.buttonLabel, 'Hiện câu');
  const absentRole = stepRolePlay(ownOnly, createRolePlay(ownOnly), { type: 'select', roleId: 'third' });
  state = stepRolePlay(ownOnly, absentRole, { type: 'start' });
  assert.equal(rolePlayView(ownOnly, state).buttonLabel, 'Hoàn tất');
  assert.ok(rolePlayView(ownOnly, state).visibleLines.every((item) => !item.hidden));
  assert.equal(stepRolePlay(ownOnly, state, { type: 'next' }).phase, 'done');
});

test('không có Mai chọn vai đầu, vai lạ và thao tác sai bước không đổi phiên', () => {
  const withoutMai = { ...dialogue, roles: dialogue.roles.filter((role) => role.id !== 'mai') };
  const initial = createRolePlay(withoutMai);
  assert.equal(initial.roleId, withoutMai.roles[0]!.id);
  assert.deepEqual(stepRolePlay(withoutMai, initial, { type: 'select', roleId: 'unknown' }), initial);
  assert.deepEqual(stepRolePlay(withoutMai, initial, { type: 'next' }), initial);
  const session = stepRolePlay(withoutMai, initial, { type: 'start' });
  assert.deepEqual(stepRolePlay(withoutMai, session, { type: 'select', roleId: 'third' }), session);
  assert.deepEqual(stepRolePlay(withoutMai, session, { type: 'start' }), session);
});

test('bắt đầu với bài không có câu nào thì sang done, không vào phiên', () => {
  const empty = { ...dialogue, lines: [] };
  const state = stepRolePlay(empty, createRolePlay(empty), { type: 'start' });
  assert.deepEqual(state, { phase: 'done', roleId: 'mai' });
});
