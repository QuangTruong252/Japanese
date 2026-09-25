import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.106.20.*'],
  experimental: {
    // Không có service worker: điều hướng khi mất mạng giữ ở trạng thái chờ và tự chạy lại
    // khi có mạng, thay vì rơi về trang lỗi của trình duyệt.
    useOffline: true,
    // Route học đều tĩnh theo build (dữ liệu học ở Dexie): giữ bản prefetch cả ngày để
    // mở phiên học được khi đang offline trong trang đã tải.
    staleTimes: { static: 86400 },
  },
};

export default nextConfig;
