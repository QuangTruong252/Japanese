import type { Dialogue, DialogueRole } from '../types/index.ts';

const PITCHES = [1, 0.8, 1.25, 0.9, 1.15] as const;

/**
 * Định danh neo HTML để cuộn tới đúng dòng thoại trong tình huống.
 */
export function dialogueAnchorId(dialogueId: string, lineIndex: number): string {
  return `dialogue-${dialogueId}-${lineIndex}`;
}

/**
 * Ánh xạ vocabId sang id neo của câu thoại đầu tiên chứa từ vựng đó.
 * Khi một từ xuất hiện nhiều lần (trong cùng tình huống hoặc khác tình huống),
 * luôn ưu tiên câu thoại đầu tiên theo thứ tự xuất hiện để người học nhảy tới ngữ cảnh sớm nhất.
 */
export function vocabDialogueAnchors(dialogues: Dialogue[]): Record<string, string> {
  const anchors: Record<string, string> = {};
  for (const dialogue of dialogues) {
    dialogue.lines.forEach((line, lineIndex) => {
      if (!line.vocabIds) return;
      for (const vocabId of line.vocabIds) {
        if (!(vocabId in anchors)) {
          anchors[vocabId] = dialogueAnchorId(dialogue.id, lineIndex);
        }
      }
    });
  }
  return anchors;
}

/**
 * Cao độ TTS cho từng vai để người học phân biệt người nói khi nghe phát âm.
 * Vai thứ i trong `roles` lấy vòng lặp từ bảng PITCHES = [1, 0.8, 1.25, 0.9, 1.15].
 * Vai lạ không có trong danh sách vai của tình huống mặc định trả về 1 (cao độ chuẩn).
 */
export function rolePitch(roles: DialogueRole[], roleId: string): number {
  const index = roles.findIndex((r) => r.id === roleId);
  if (index === -1) return 1;
  return PITCHES[index % PITCHES.length] ?? 1;
}

/**
 * Xác định vai đứng bên phải ở chế độ đọc hội thoại.
 * Mặc định ưu tiên vai người học (Mai) nếu có mặt trong tình huống;
 * nếu không có Mai thì lấy vai đầu tiên trong danh sách vai làm người nói bên phải.
 */
export function readingRightRoleId(dialogue: Dialogue): string {
  if (dialogue.roles.some((r) => r.id === 'mai')) {
    return 'mai';
  }
  return dialogue.roles[0]?.id ?? '';
}
