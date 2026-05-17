// ============================================================
// 覚醒の道 — Service Worker
// バージョンを上げるたびに自動で最新キャッシュに切り替わります
// ============================================================

const CACHE_VERSION = 'kakusei-v3';
const CACHE_FILES = [
  './',
  './index.html',
];

// インストール時：キャッシュに保存
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(CACHE_FILES);
    })
  );
  // 即座にアクティブ化（待機せず）
  self.skipWaiting();
});

// アクティベート時：古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// フェッチ時：ネットワーク優先 → 失敗したらキャッシュ
// （ネットワーク優先にすることで常に最新版を取得）
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 成功したらキャッシュも更新
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // オフライン時はキャッシュから返す
        return caches.match(event.request);
      })
  );
});

// メッセージ受信（SKIP_WAITING）
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
