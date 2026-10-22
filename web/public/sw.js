// Chỉ cache ảnh minh họa để học offline vẫn thấy tranh. Mọi request khác (trang, JS, API) không bị
// chặn, để điều hướng offline vẫn do Next xử lý như cũ.
// Tên ảnh có hậu tố -vN và /_next/image khóa theo URL, nên ảnh đã cache không bao giờ cũ: cache-first.
// ponytail: cache không giới hạn (tối đa vài chục MB cho toàn bộ ảnh N5), thêm dọn LRU nếu kho ảnh lớn lên.
const CACHE = 'illustrations-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const isIllustration =
    url.pathname.startsWith('/assets/illustrations/') ||
    (url.pathname === '/_next/image' && url.searchParams.get('url')?.startsWith('/assets/illustrations/'));
  if (!isIllustration) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      // /_next/image trả Vary: Accept; cùng một trình duyệt luôn nhận cùng định dạng nên bỏ qua Vary.
      const hit = await cache.match(request, { ignoreVary: true });
      if (hit) return hit;
      const res = await fetch(request);
      if (res.ok) cache.put(request, res.clone());
      return res;
    }),
  );
});
