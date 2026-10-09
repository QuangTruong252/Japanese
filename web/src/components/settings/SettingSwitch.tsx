import { useId } from 'react';
import { cn } from '@/lib/utils';
import { SettingRow } from './SettingRow';

/** Dòng công tắc: nhãn bấm được, nút `role="switch"` cao 44 px để dễ chạm. */
export function SettingSwitch({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <SettingRow label={label} labelFor={id}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className="-my-1.5 -mr-1 flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-end rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring"
      >
        <span
          className={cn(
            'relative inline-flex h-7 w-12 rounded-full border-2 border-transparent transition-colors duration-150 ease-out',
            checked ? 'bg-primary' : 'bg-muted-foreground/30',
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block size-6 rounded-full bg-background shadow-sm transition-transform duration-150 ease-out',
              checked ? 'translate-x-5' : 'translate-x-0',
            )}
          />
        </span>
      </button>
    </SettingRow>
  );
}
