// 通信なしで遊べるようにする手元の置き場（Service Worker）。VERSION と PRECACHE は Web/tools/make_sw.py が書く。
// 中身が変わると VERSION が変わり、古い置き場を捨てて入れ替わる。公開の形（tools/stage.py）では、プログラムは版ごとの箱 v/<VERSION>/ に入る。

const VERSION = '689815d8e19d';
const PRECACHE = [
  './',
  'v/689815d8e19d/app.css',
  'assets/fonts/OFL-BigShouldersDisplay.txt',
  'assets/fonts/OFL-ZenMaruGothic.txt',
  'assets/fonts/big-shoulders.woff',
  'assets/fonts/zen-maru-500.woff',
  'assets/fonts/zen-maru-700.woff',
  'assets/fonts/zen-maru-900.woff',
  'assets/icons/apple-touch-icon.png',
  'assets/icons/favicon-32.png',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-512.png',
  'index.html',
  'v/689815d8e19d/js/app.js',
  'v/689815d8e19d/js/web.js',
  'manifest.webmanifest',
  'privacy.html',
];
// @@PRECACHE_END

const CACHE = `hakoniwagolf-${VERSION}`;

self.addEventListener('install', (e) => {
  // ブラウザの HTTP の置き場（GitHub Pages は 10 分置かせる）を通さず、いまサイトにある物を取りに行く
  const fresh = PRECACHE.map((u) => new Request(u, { cache: 'reload' }));
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(fresh)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('hakoniwagolf-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** ゲームのページ（置き場の頭か index.html）を開く要求か。ほかのページはそのページのまま */
function isGamePage(req, url) {
  if (req.mode !== 'navigate') return false;
  const scope = new URL(self.registration.scope).pathname;
  return url.pathname === scope || url.pathname === `${scope}index.html`;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // ランキング（別の場所の API）と POST は手元に置かない
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const game = isGamePage(req, url);
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(game ? 'index.html' : req, { ignoreSearch: game });
    if (hit) return hit;
    const res = await fetch(req);
    // 初めて読んだものも置いておく。置き終わるまで Service Worker を止めさせない。
    // <audio> は Range で読むので 206 になり、置けない（通信なしのときは曲だけ鳴らない）
    if (res.status === 200 && res.type === 'basic') e.waitUntil(cache.put(req, res.clone()));
    return res;
  })());
});
