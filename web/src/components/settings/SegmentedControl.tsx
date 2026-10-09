'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SettingRow } from './SettingRow';

/** Dòng chọn một trong vài giá trị, dạng ô liền nhau; ô đang chọn nền `primary`. Không cho bỏ chọn. */
export function SegmentedControl<T extends string>({
  label,
  labelId,
  value,
  options,
  onChange,
}: {
  label: string;
  labelId: string;
  value: T;
  options: { value: T; text: string; ariaLabel: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <SettingRow label={label} labelId={labelId}>
      <ToggleGroup
        aria-labelledby={labelId}
        variant="outline"
        spacing={0}
        className="overflow-hidden rounded-lg [&_[data-slot=toggle-group-item]]:min-h-11 [&_[data-slot=toggle-group-item]]:px-4 [&_[data-slot=toggle-group-item]]:text-sm [&_[data-slot=toggle-group-item]]:border-border [&_[data-slot=toggle-group-item][aria-pressed=true]]:bg-primary [&_[data-slot=toggle-group-item][aria-pressed=true]]:text-primary-foreground"
        value={[value]}
        onValueChange={(val: string[]) => {
          const chosen = options.find((o) => o.value === val[val.length - 1]);
          if (chosen) onChange(chosen.value);
        }}
      >
        {options.map((o) => (
          <ToggleGroupItem key={o.value} value={o.value} aria-label={o.ariaLabel}>
            {o.text}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </SettingRow>
  );
}
