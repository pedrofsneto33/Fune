/* Service Worker do EternityOS — PWA offline para o plantao 24h.
 * Estrategia:
 *  - HTML/navegacao e demais GET same-origin: NETWORK-FIRST (rede primeiro;
 *    cache usado apenas como fallback quando offline). Garante que o usuario
 *    sempre receba a versao nova após cada deploy.
 *  - Assets imutaveis do Next (/_next/static, /_next/immutable, hash no nome):
 *    CACHE-FIRST (seguro, pois o hash muda a cada build).
 *  - Chamadas /api/ NUNCA sao cacheadas (dados sensiveis sempre da rede).
 * v2: corrige cache stale que escondia atualizacoes da interface. */
const CACHE = 'eternityos-v2';
const CORE = ['/landing', '/login', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return; // dados sempre da rede

  // Assets imutaveis (hash no nome do arquivo): cache-first e seguro
  const isImmutable =
    url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/_next/immutable/');

  if (isImmutable) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res && res.status === 200 && res.type === 'basic') cache.put(req, res.clone());
          return res;
        } catch {
          return Response.error();
        }
      }),
    );
    return;
  }

  // Documentos, paginas e demais recursos: NETWORK-FIRST
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || Response.error()),
      ),
  );
});
