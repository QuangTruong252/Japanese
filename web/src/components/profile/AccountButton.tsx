'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { BarChart3, Settings, User, X } from 'lucide-react';
import { ListRow } from '@/components/PaperKit';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface AccountButtonUser {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
}

export function AccountButton({ className, user }: { className?: string; user: AccountButtonUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = pathname.startsWith('/ca-nhan') || pathname.startsWith('/cai-dat');
  const close = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="quiz" className={cn('size-11 min-w-11 rounded-full p-0', isActive && 'bg-accent text-primary', className)} />} aria-label="Hồ sơ và cài đặt">
        {user?.avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={user.avatarUrl} alt="" className="size-7 rounded-full border border-border object-cover" />
        ) : <User className="size-5" aria-hidden="true" />}
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogClose render={<Button variant="ghost" size="quiz" aria-label="Đóng" className="absolute right-1 top-1 size-11 p-0" />}><X aria-hidden="true" /></DialogClose>
        <DialogHeader className="min-h-8 justify-center pr-9"><DialogTitle>{user?.displayName || 'Cá nhân'}</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-2">
          <ListRow href="/ca-nhan" onClick={close} icon={<BarChart3 />} title="Tiến độ" />
          <ListRow href="/ca-nhan/thong-ke" onClick={close} icon={<BarChart3 />} title="Thống kê" />
          <ListRow href="/ca-nhan#account-heading" onClick={close} icon={<User />} title="Tài khoản" />
          <ListRow href="/cai-dat" onClick={close} icon={<Settings />} title="Cài đặt" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
