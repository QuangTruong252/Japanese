import { Furigana } from '@/components/Furigana';
import { SpeakButton } from '@/components/SpeakButton';
import { ProfileAvatar } from '@/components/dialogue/CharacterSheet';
import { SPEAK_CLASS } from '@/components/dialogue/reader-styles';
import { formatOptionalBrackets, stripFurigana } from '@/lib/japanese';
import { cn } from '@/lib/utils';
import type { DialogueLine, DialogueRole } from '@/types';

/** Chuỗi để đọc thành tiếng: kana nếu dữ liệu có, không thì bỏ furigana khỏi câu. */
export const lineText = (line: DialogueLine) => line.kana ?? stripFurigana(formatOptionalBrackets(line.jp));

/**
 * Một câu thoại dùng chung cho tab đọc và màn nhập vai: tên vai + avatar, bong bóng, nghĩa, nút loa.
 * Nút loa nằm hàng dưới cạnh nghĩa (mép trong) để cột chữ Nhật giữ nguyên bề rộng bong bóng:
 * ở 390 px cột còn ~243 px, vừa một cụm 10 ký tự cỡ 20 px (200 px), đặt loa bên cạnh sẽ chỉ còn ~191 px.
 */
export function DialogueBubble({
  role,
  line,
  side,
  pitch,
  showSpeak = true,
  id,
  active = false,
  className,
}: {
  role: DialogueRole;
  line: DialogueLine;
  side: 'left' | 'right';
  pitch?: number;
  showSpeak?: boolean;
  /** Neo để nhảy tới câu. */
  id?: string;
  /** Câu đang được đọc. */
  active?: boolean;
  className?: string;
}) {
  const right = side === 'right';
  return (
    <div id={id} className={cn('flex min-w-0 flex-col gap-1', right ? 'items-end' : 'items-start', className)}>
      <div className={cn('flex items-center gap-2', right && 'flex-row-reverse')}>
        <ProfileAvatar role={role} size={32} />
        <Furigana text={role.name} className="text-sm font-medium text-muted-foreground" />
      </div>
      <div
        className={cn(
          'min-w-0 max-w-[85%] rounded-2xl border border-transparent px-4 py-2 transition-colors md:px-6 md:py-3',
          right ? 'rounded-tr-md bg-accent' : 'rounded-tl-md bg-secondary',
          active && 'border-primary',
        )}
      >
        <div className="jp-example font-normal leading-loose text-foreground md:text-2xl!">
          <Furigana text={line.jp} />
        </div>
        <div className={cn('flex min-w-0 items-center gap-2', right && 'flex-row-reverse')}>
          <p className="translation min-w-0 flex-1 text-sm leading-relaxed text-muted-foreground md:text-base">
            {line.translation.vi}
          </p>
          {showSpeak && (
            <SpeakButton
              text={lineText(line)}
              label={stripFurigana(formatOptionalBrackets(line.jp))}
              pitch={pitch}
              className={SPEAK_CLASS}
            />
          )}
        </div>
      </div>
    </div>
  );
}
