import type { MetadataRoute } from 'next';

// Chỉ để cài lên màn hình chính, không có service worker.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MaiPace — Tự học tiếng Nhật',
    short_name: 'MaiPace',
    description: 'Học tiếng Nhật theo nhịp của bạn.',
    lang: 'vi',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    // Khớp themeColor sáng trong layout.tsx.
    background_color: '#fbf6ec',
    theme_color: '#fbf6ec',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
