import type { IllustrationAsset } from '../types/index.ts';

const ASSET_PATH = /^\/assets\/illustrations\/(?:ui\/(?:banners|states|decor)|scenes|vocab|grammar)\/[a-z0-9]+(?:-[a-z0-9]+)*-v[1-9][0-9]*\.webp$/;

/** Kiểm metadata ở biên nạp JSON; kiểm file thật/kích thước nằm trong test nội dung. */
export function validateIllustrationAsset(value: unknown): asserts value is IllustrationAsset {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Tham chiếu ảnh minh họa không hợp lệ.');
  }
  const asset = value as Partial<IllustrationAsset>;
  if (
    typeof asset.src !== 'string' || !ASSET_PATH.test(asset.src) ||
    !Number.isSafeInteger(asset.width) || (asset.width ?? 0) <= 0 ||
    !Number.isSafeInteger(asset.height) || (asset.height ?? 0) <= 0 ||
    typeof asset.alt?.vi !== 'string' ||
    (asset.alt.en !== undefined && typeof asset.alt.en !== 'string')
  ) {
    throw new Error('Đường dẫn, kích thước hoặc mô tả ảnh minh họa không hợp lệ.');
  }
}
