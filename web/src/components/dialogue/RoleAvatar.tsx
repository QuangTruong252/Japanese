import type { DialogueRole } from '@/types';
import { getRoleAvatar } from '@/lib/characters';
import { stripFurigana } from '@/lib/japanese';
import { Illustration } from '@/components/Illustration';
import { cn } from '@/lib/utils';

const SIZE_CONFIG: Record<32 | 40 | 48, { container: string; sizes: string }> = {
  // sizes tính cả mức phóng 1.7× để trình duyệt tải đủ điểm ảnh cho khuôn mặt.
  32: { container: 'size-8 text-sm', sizes: '55px' },
  40: { container: 'size-10 text-base', sizes: '68px' },
  48: { container: 'size-12 text-lg', sizes: '82px' },
};

export function RoleAvatar({
  role,
  size = 32,
  className,
}: {
  role: DialogueRole;
  size?: 32 | 40 | 48;
  className?: string;
}) {
  const avatar = getRoleAvatar(role.id);
  const config = SIZE_CONFIG[size] ?? SIZE_CONFIG[32];

  if (avatar) {
    // alt rỗng vì tên nhân vật luôn hiển thị bên cạnh avatar trong hàng thoại
    const asset = avatar.alt?.vi === '' ? avatar : { ...avatar, alt: { ...avatar.alt, vi: '' } };
    return (
      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent',
          config.container,
          className,
        )}
      >
        <Illustration
          asset={asset}
          sizes={config.sizes}
          // Chân dung bán thân: đầu + cổ áo chiếm ~9–62% chiều cao ảnh, phóng 1.7 lần quanh điểm 19% để mặt đầy vòng tròn
          className="size-full origin-[50%_19%] scale-[1.7] rounded-full object-cover"
        />
      </div>
    );
  }

  const initial = Array.from(stripFurigana(role.name))[0] ?? '';

  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-accent font-jp font-semibold leading-none text-primary select-none',
        config.container,
        className,
      )}
    >
      {initial}
    </div>
  );
}
