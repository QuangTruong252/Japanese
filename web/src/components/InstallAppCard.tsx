'use client';

import { useId, useState, useSyncExternalStore } from 'react';
import { Smartphone } from 'lucide-react';
import { SectionHeader } from '@/components/PaperKit';
import { ActionRow } from '@/components/settings/ActionRow';
import { SettingsGroup } from '@/components/settings/SettingRow';

// Hướng dẫn bằng chữ, không dùng beforeinstallprompt (không có trên Safari iOS).
const noop = () => () => {};
function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function InstallAppCard() {
  const headingId = useId();
  const [open, setOpen] = useState(false);
  // Server và lần render đầu coi như đã cài để không nháy khối rồi ẩn.
  const standalone = useSyncExternalStore(noop, isStandalone, () => true);
  const ios = useSyncExternalStore(noop, isIOS, () => false);
  if (standalone) return null;

  return (
    <section aria-labelledby={headingId}>
      <SectionHeader id={headingId} title="Ứng dụng" />
      <SettingsGroup>
        <ActionRow
          icon={<Smartphone />}
          title="Cài lên màn hình chính"
          expanded={open}
          onClick={() => setOpen((v) => !v)}
        />
        {open && (
          <div className="space-y-3 px-4 py-3 text-sm">
            <ul className="space-y-1.5 text-muted-foreground">
              <li><span className="font-medium text-foreground">iPhone/iPad:</span> Safari → nút Chia sẻ → “Thêm vào MH chính”</li>
              <li><span className="font-medium text-foreground">Android:</span> Chrome → menu ⋮ → “Cài đặt ứng dụng”</li>
              <li><span className="font-medium text-foreground">Máy tính:</span> biểu tượng cài đặt ở thanh địa chỉ</li>
            </ul>
            {ios && (
              <p className="text-muted-foreground">
                Trên iPhone, app đã cài có dữ liệu riêng với Safari — đăng nhập đồng bộ ở mục Tài khoản
                để mang tiến độ sang.
              </p>
            )}
          </div>
        )}
      </SettingsGroup>
    </section>
  );
}
