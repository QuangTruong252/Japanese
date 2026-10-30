import type { IllustrationAsset } from '../types/index.ts';
import { validateIllustrationAsset } from './illustrations.ts';
import charactersData from '../data/n5/characters.json' with { type: 'json' };

export interface CharacterEntry {
  name: string;
  kind: 'main' | 'extra';
  roleVi: string;
  bioVi?: string;
  canon?: string[];
  avatar: IllustrationAsset;
}

const characters = charactersData as unknown as Record<string, CharacterEntry>;

// Kiểm mỗi avatar lúc nạp module; lỗi dữ liệu ném sớm giống loadLesson để phát hiện ngay khi khởi động
for (const [id, entry] of Object.entries(characters)) {
  if (!entry || typeof entry !== 'object' || !('avatar' in entry) || !entry.avatar) {
    throw new Error(`Dữ liệu nhân vật ${id} không có thông tin avatar hợp lệ.`);
  }
  validateIllustrationAsset(entry.avatar);
}

/** Nhân vật chính (có hồ sơ), theo thứ tự trong dữ liệu. */
export const MAIN_CHARACTER_IDS: readonly string[] = Object.keys(characters).filter((id) => characters[id]!.kind === 'main');

export function getCharacter(id: string): CharacterEntry | undefined {
  return Object.hasOwn(characters, id) ? characters[id] : undefined;
}

/**
 * Lấy ảnh minh họa avatar của nhân vật theo roleId nếu có.
 * Trả về undefined khi nhân vật chưa được cấu hình ảnh riêng trong dữ liệu.
 */
export function getRoleAvatar(roleId: string): IllustrationAsset | undefined {
  return getCharacter(roleId)?.avatar;
}
