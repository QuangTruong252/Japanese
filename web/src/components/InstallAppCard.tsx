'use client';

import { useSyncExternalStore } from 'react';
import { Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// SPEC-14 §3.2: hướng dẫn bằng chữ, không dùng beforeinstallprompt (không có trên Safari iOS).
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
  // Server và lần render đầu coi như đã cài để không nháy khối rồi ẩn.
  const standalone = useSyncExternalStore(noop, isStandalone, () => true);
  const ios = useSyncExternalStore(noop, isIOS, () => false);
  if (standalone) return null;

  return (
    <section className="space-y-4" aria-labelledby="heading-install">
      <h2 id="heading-install" className="font-heading text-base font-medium text-foreground">
        Ứng dụng
      </h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Smartphone className="size-4 text-muted-foreground" aria-hidden />
            Cài lên màn hình chính
          </CardTitle>
          <CardDescription className="text-xs">
            Mở MaiPace như một app, không có thanh trình duyệt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="space-y-1.5 text-muted-foreground">
            <li><span className="font-medium text-foreground">iPhone/iPad:</span> Safari → nút Chia sẻ → “Thêm vào MH chính”</li>
            <li><span className="font-medium text-foreground">Android:</span> Chrome → menu ⋮ → “Cài đặt ứng dụng”</li>
            <li><span className="font-medium text-foreground">Máy tính:</span> biểu tượng cài đặt ở thanh địa chỉ</li>
          </ul>
          {ios && (
            <p className="text-xs text-muted-foreground">
              Trên iPhone, app đã cài có dữ liệu riêng với Safari — đăng nhập đồng bộ ở mục Tài khoản
              để mang tiến độ sang.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
