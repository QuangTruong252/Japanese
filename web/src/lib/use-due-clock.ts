'use client';

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

/**
 * Mốc thời gian dùng cho mọi truy vấn "đến hạn" (SPEC-02 §2.2).
 *
 * `useLiveQuery` chạy lại khi bảng Dexie đổi — nhưng thời gian trôi qua KHÔNG phải là một thay
 * đổi của bảng. Tab mở từ 8 giờ sáng sẽ hiện số liệu của 8 giờ sáng cho tới khi người dùng làm
 * một phiên. Ba nguồn kích hoạt:
 *
 *   1. tab hiện lại (`visibilitychange`) và cửa sổ lấy lại focus
 *   2. một `setTimeout` hẹn đúng tới mốc `dueAt` gần nhất còn ở tương lai
 *   3. (bên ngoài hook) `useLiveQuery` khi reviewItems đổi
 *
 * Không dùng `setInterval` mỗi phút: 99% số lần chạy sẽ cho ra đúng con số cũ.
 */
export function useDueClock(): Date {
  const [now, setNow] = useState(() => new Date());

  // Mốc đến hạn kế tiếp — Dexie tự bắn lại khi lịch ôn đổi.
  const nextDueAt = useLiveQuery(
    () => db.reviewItems.where('dueAt').above(now).first().then((item) => item?.dueAt ?? null),
    [now]
  );

  useEffect(() => {
    const tick = () => setNow(new Date());

    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', tick);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', tick);
    };
  }, []);

  useEffect(() => {
    if (!nextDueAt) return;

    // +1s để chắc chắn đã qua mốc; setTimeout tràn số khi delay > ~24.8 ngày nên chặn trần.
    // Mốc đã qua thì hẹn 0ms: vẫn là một tick riêng, không setState đồng bộ trong effect.
    const delay = Math.min(
      Math.max(nextDueAt.getTime() - Date.now() + 1000, 0),
      2 ** 31 - 1
    );

    const timer = setTimeout(() => setNow(new Date()), delay);
    return () => clearTimeout(timer);
  }, [nextDueAt]);

  return now;
}
