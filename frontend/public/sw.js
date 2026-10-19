const CACHE_NAME = 'dulingo-pwa-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// Install: pre-cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up obsolete cache versions and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: smart caching strategies
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignore non-GET requests (e.g., POST submit is handled with client offline queue)
  if (req.method !== 'GET') {
    return;
  }

  // 1. API Endpoints (Network-first with cache fallback)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          // If valid response, clone and update cache
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        })
        .catch(async () => {
          // Offline fallback: serve cached API data (e.g. /api/tasks/today, /api/stories)
          const cached = await caches.match(req);
          if (cached) return cached;

          // If it's tasks/today and not in cache, return an empty task structure with offline flag
          if (url.pathname.includes('/tasks/today')) {
            return new Response(
              JSON.stringify({
                tasks: [],
                summary: { done: 0, pending: 0, total: 0 },
                user: { name: 'Learner', xp: 0, streak: 0 },
                isOffline: true,
              }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          }
          return new Response(
            JSON.stringify({ error: 'Offline mode: Network unavailable', isOffline: true }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // 2. Navigation Requests (SPA fallback to index.html)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 3. Static Assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

// ---------- Web Push Notifications & Scheduled Engagement Nudge ----------

// Notification click event handler: open or focus the quest/dashboard tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Message listener from web client to trigger or schedule streak nudges
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'SHOW_STREAK_NUDGE') {
    const title = data.title || '🔥 Dulingo: Your streak is at risk!';
    const options = {
      body: data.body || 'Complete today’s 2-minute public service lesson to keep your streak!',
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      tag: 'dulingo-streak-nudge',
      renotify: true,
      requireInteraction: false,
      data: { url: data.url || '/quest' },
      actions: [
        { action: 'practice', title: 'Practice Now' },
        { action: 'later', title: 'Later' },
      ],
      ...data.options,
    };
    self.registration.showNotification(title, options);
  }

  if (data.type === 'SCHEDULE_STREAK_CHECK') {
    const delay = Math.max(Number(data.delayMs) || 0, 1000);
    setTimeout(() => {
      self.registration.showNotification(
        data.title || '🔥 Streak Reminder: Don’t lose your progress!',
        {
          body: data.body || 'Practice today’s public service tasks before midnight to keep your streak alive.',
          icon: '/icons/icon-192.svg',
          badge: '/icons/icon-192.svg',
          tag: 'dulingo-streak-nudge',
          renotify: true,
          data: { url: '/quest' },
        }
      );
    }, delay);
  }
});

// Periodic background sync if supported by browser
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'streak-check') {
    event.waitUntil(
      caches.match('/api/tasks/today').then(async (response) => {
        if (!response) return;
        const data = await response.json().catch(() => null);
        if (data && data.summary && data.summary.pending > 0) {
          const streak = data.user?.streak || 0;
          return self.registration.showNotification(
            streak > 0 ? `🔥 Your ${streak}-Day Streak is at Risk!` : '⚡ Daily Tasks Waiting on Dulingo!',
            {
              body: `You have ${data.summary.pending} tasks remaining today. Complete them before midnight to protect your XP!`,
              icon: '/icons/icon-192.svg',
              badge: '/icons/icon-192.svg',
              tag: 'dulingo-streak-nudge',
              data: { url: '/quest' },
            }
          );
        }
      })
    );
  }
});
