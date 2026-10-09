'use client';

import { useId, type ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SettingRow } from './SettingRow';

/** Ô số dạng [− 20 +]: nút và ô gõ chung một khung; giá trị luôn kẹp trong [min, max]. */
export function NumberStepper({
  id,
  label,
  hint,
  unit,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id?: string;
  label: string;
  hint?: ReactNode;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const inputId = useId();
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <SettingRow id={id} label={label} labelFor={inputId} hint={hint} nowrap>
      <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-border bg-background">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 rounded-none"
          aria-label={`Giảm ${step} ${unit}`}
          disabled={value <= min}
          onClick={() => onChange(clamp(value - step))}
        >
          <Minus />
        </Button>
        <Input
          id={inputId}
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const val = Number.parseInt(e.target.value, 10);
            if (!Number.isNaN(val)) onChange(clamp(val));
          }}
          className="h-11 w-14 rounded-none border-0 border-x border-border bg-transparent px-1 text-center font-medium tabular-nums [appearance:textfield] dark:bg-transparent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 rounded-none"
          aria-label={`Tăng ${step} ${unit}`}
          disabled={value >= max}
          onClick={() => onChange(clamp(value + step))}
        >
          <Plus />
        </Button>
      </div>
    </SettingRow>
  );
}
