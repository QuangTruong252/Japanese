import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Dialogue, DialogueRole } from '../types/index.ts';
import {
  dialogueAnchorId,
  vocabDialogueAnchors,
  rolePitch,
  readingRightRoleId,
} from './kaiwa.ts';

test('dialogueAnchorId tạo id neo đúng định dạng', () => {
  assert.equal(dialogueAnchorId('l01-hajimemashite', 0), 'dialogue-l01-hajimemashite-0');
  assert.equal(dialogueAnchorId('l02-kore-wa', 5), 'dialogue-l02-kore-wa-5');
});

test('vocabDialogueAnchors trỏ đúng câu thoại đầu tiên và lấy lần đầu khi xuất hiện ở nhiều tình huống', () => {
  const d1: Dialogue = {
    id: 'd1',
    title: { vi: 'Tình huống 1' },
    roles: [{ id: 'mai', name: 'マイ' }, { id: 'tanaka', name: '田中' }],
    lines: [
      { speaker: 'tanaka', jp: 'はじめまして', translation: { vi: 'Chào' }, vocabIds: ['hajimemashite'] },
      { speaker: 'mai', jp: 'どうぞ よろしく', translation: { vi: 'Rất mong giúp đỡ' }, vocabIds: ['douzo', 'yoroshiku'] },
      { speaker: 'tanaka', jp: 'どうぞ', translation: { vi: 'Xin mời' }, vocabIds: ['douzo'] },
    ],
  };

  const d2: Dialogue = {
    id: 'd2',
    title: { vi: 'Tình huống 2' },
    roles: [{ id: 'satou', name: '佐藤' }, { id: 'suzuki', name: '鈴木' }],
    lines: [
      // 'douzo' xuất hiện lần 2 ở tình huống 2, phải giữ neo ở tình huống 1 dòng 1
      { speaker: 'satou', jp: 'どうぞ', translation: { vi: 'Xin mời' }, vocabIds: ['douzo', 'arigatou'] },
      { speaker: 'suzuki', jp: 'ありがとう', translation: { vi: 'Cảm ơn' }, vocabIds: ['arigatou'] },
    ],
  };

  const anchors = vocabDialogueAnchors([d1, d2]);
  assert.equal(anchors.hajimemashite, 'dialogue-d1-0');
  assert.equal(anchors.douzo, 'dialogue-d1-1');
  assert.equal(anchors.yoroshiku, 'dialogue-d1-1');
  assert.equal(anchors.arigatou, 'dialogue-d2-0');
  assert.equal(anchors.chotto, undefined);
});

test('vocabDialogueAnchors xử lý mảng rỗng hoặc dòng thoại không có vocabIds', () => {
  assert.deepEqual(vocabDialogueAnchors([]), {});

  const d: Dialogue = {
    id: 'd0',
    title: { vi: 'Không từ vựng' },
    roles: [{ id: 'mai', name: 'マイ' }],
    lines: [
      { speaker: 'mai', jp: 'はい', translation: { vi: 'Vâng' } },
    ],
  };
  assert.deepEqual(vocabDialogueAnchors([d]), {});
});

test('rolePitch tính đúng cao độ theo vị trí vai và trả về 1 cho vai lạ', () => {
  const roles: DialogueRole[] = [
    { id: 'r0', name: 'Vai 0' },
    { id: 'r1', name: 'Vai 1' },
    { id: 'r2', name: 'Vai 2' },
    { id: 'r3', name: 'Vai 3' },
    { id: 'r4', name: 'Vai 4' },
    { id: 'r5', name: 'Vai 5 (vòng lại vai 0)' },
  ];

  assert.equal(rolePitch(roles, 'r0'), 1);
  assert.equal(rolePitch(roles, 'r1'), 0.8);
  assert.equal(rolePitch(roles, 'r2'), 1.25);
  assert.equal(rolePitch(roles, 'r3'), 0.9);
  assert.equal(rolePitch(roles, 'r4'), 1.15);
  assert.equal(rolePitch(roles, 'r5'), 1);

  // Vai lạ không có trong roles
  assert.equal(rolePitch(roles, 'vai-la'), 1);
  assert.equal(rolePitch([], 'r0'), 1);
});

test('readingRightRoleId chọn mai nếu có, hoặc chọn roles[0].id khi tình huống không có mai', () => {
  const withMaiAsFirst: Dialogue = {
    id: 'd1',
    title: { vi: 'Có Mai ở đầu' },
    roles: [{ id: 'mai', name: 'マイ' }, { id: 'tanaka', name: '田中' }],
    lines: [],
  };
  assert.equal(readingRightRoleId(withMaiAsFirst), 'mai');

  const withMaiAsSecond: Dialogue = {
    id: 'd2',
    title: { vi: 'Có Mai ở sau' },
    roles: [{ id: 'tanaka', name: '田中' }, { id: 'mai', name: 'マイ' }],
    lines: [],
  };
  assert.equal(readingRightRoleId(withMaiAsSecond), 'mai');

  const withoutMai: Dialogue = {
    id: 'd3',
    title: { vi: 'Không có Mai' },
    roles: [{ id: 'tanaka', name: '田中' }, { id: 'satou', name: '佐藤' }],
    lines: [],
  };
  assert.equal(readingRightRoleId(withoutMai), 'tanaka');

  const emptyRoles: Dialogue = {
    id: 'd4',
    title: { vi: 'Không có vai' },
    roles: [],
    lines: [],
  };
  assert.equal(readingRightRoleId(emptyRoles), '');
});
