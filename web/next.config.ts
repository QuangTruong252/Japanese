import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.106.20.*'],
  async redirects() {
    // Thống kê đã chuyển vào trang Cá nhân; query string được giữ nguyên.
    return [{ source: '/thong-ke', destination: '/ca-nhan/thong-ke', permanent: false }];
  },
  images: {
    // AVIF nhẹ hơn WebP rõ với tranh phẳng; trình duyệt cũ vẫn nhận WebP.
    formats: ['image/avif', 'image/webp'],
    // Ảnh minh họa mang hậu tố -vN, đổi ảnh là đổi URL, nên bản đã tối ưu giữ được một năm
    // thay vì xác thực lại sau mỗi 4 giờ mặc định.
    minimumCacheTTL: 31536000,
  },
  async headers() {
    return [{
      source: '/assets/illustrations/:path*/:file([a-z0-9-]+-v[1-9][0-9]*\\.webp)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    }];
  },
  experimental: {
    // Service worker chỉ cache ảnh, không đụng điều hướng: điều hướng khi mất mạng giữ ở trạng thái chờ và tự chạy lại
    // khi có mạng, thay vì rơi về trang lỗi của trình duyệt.
    useOffline: true,
    // Route học đều tĩnh theo build (dữ liệu học ở Dexie): giữ bản prefetch cả ngày để
    // mở phiên học được khi đang offline trong trang đã tải.
    staleTimes: { static: 86400 },
  },
};

export default nextConfig;
