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

test('ba vai: câu đầu/cuối của mình phải hiện câu trước khi tiến, giữ lịch sử', () => {
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
  assert.equal(rolePlayView(dialogue, state).buttonLabel, 'Tiếp');
  assert.equal(rolePlayView(dialogue, state).visibleLines[0]!.hidden, false);
  for (const count of [2, 3]) {
    state = stepRolePlay(dialogue, state, { type: 'next' });
    view = rolePlayView(dialogue, state);
    assert.equal(view.progress, `${count}/4`);
    assert.equal(view.isOwnTurn, false);
    assert.equal(view.buttonLabel, 'Tiếp');
    assert.equal(view.visibleLines.length, count);
    assert.ok(view.visibleLines.every((item) => !item.hidden));
  }
  state = stepRolePlay(dialogue, state, { type: 'next' });
  assert.equal(rolePlayView(dialogue, state).buttonLabel, 'Hiện câu');
  assert.equal(rolePlayView(dialogue, state).visibleLines[3]!.hidden, true);
  state = stepRolePlay(dialogue, state, { type: 'next' });
  assert.equal(state.phase, 'session');
  assert.equal(rolePlayView(dialogue, state).progress, '4/4');
  state = stepRolePlay(dialogue, state, { type: 'next' });
  assert.equal(state.phase, 'done');
  assert.equal(rolePlayView(dialogue, state).progress, '4/4');
  assert.deepEqual(stepRolePlay(dialogue, state, { type: 'next' }), state);
  state = stepRolePlay(dialogue, state, { type: 'change-role' });
  assert.equal(state.phase, 'pick');
  assert.equal(rolePlayView(dialogue, state).visibleLines.length, 0);
  state = stepRolePlay(dialogue, state, { type: 'select', roleId: 'third' });
  state = stepRolePlay(dialogue, state, { type: 'start' });
  assert.equal(rolePlayView(dialogue, state).isOwnTurn, false);
  assert.equal(rolePlayView(dialogue, state).buttonLabel, 'Tiếp');
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
