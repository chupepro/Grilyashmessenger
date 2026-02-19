// Firebase Messaging Service Worker — Грильяж
// Этот файл ДОЛЖЕН лежать в корне репозитория GitHub Pages (рядом с index.html)

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCUETatARBNyQt4B5REqzTkDniiKq7LOJg",
  authDomain: "grilyash-1fe86.firebaseapp.com",
  projectId: "grilyash-1fe86",
  storageBucket: "grilyash-1fe86.firebasestorage.app",
  messagingSenderId: "139165261793",
  appId: "1:139165261793:web:b03bfb166a8c09b0bc3ca0"
});

const messaging = firebase.messaging();

// Фоновые push-уведомления (когда вкладка закрыта/свёрнута)
messaging.onBackgroundMessage(payload => {
  console.log('[SW] Фоновое уведомление:', payload);
  const { title, body, icon, data } = payload.notification || {};
  const notifData = payload.data || data || {};

  self.registration.showNotification(title || '🍯 Грильяж', {
    body: body || '',
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: notifData.type === 'call' ? 'grilyazh-call' : 'grilyazh-msg',
    renotify: true,
    requireInteraction: notifData.type === 'call', // звонок не исчезает сам
    vibrate: notifData.type === 'call' ? [400,200,400,200,400,200,400] : [200,100,200],
    data: notifData,
    actions: notifData.type === 'call'
      ? [
          { action: 'accept', title: '✅ Принять' },
          { action: 'decline', title: '❌ Отклонить' }
        ]
      : [
          { action: 'open', title: '💬 Открыть' }
        ]
  });
});

// Клик по уведомлению
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const data = event.notification.data || {};
  const action = event.action;

  if (action === 'decline') return; // просто закрыть

  // Открыть/сфокусировать вкладку
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          // Передать данные в открытую вкладку
          client.postMessage({ type: 'NOTIF_CLICK', data, action });
          return;
        }
      }
      // Вкладка не открыта — открыть новую
      return clients.openWindow(self.location.origin + (data.path || '/'));
    })
  );
});

// Push без payload (data-only push)
self.addEventListener('push', event => {
  if (event.data) {
    try {
      const payload = event.data.json();
      // Уже обрабатывается onBackgroundMessage, но на всякий случай:
      if (payload && payload.notification) return;
      // data-only push
      const d = payload.data || {};
      event.waitUntil(
        self.registration.showNotification(d.title || '🍯 Грильяж', {
          body: d.body || '',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: d.type === 'call' ? 'grilyazh-call' : 'grilyazh-msg',
          requireInteraction: d.type === 'call',
          vibrate: d.type === 'call' ? [400,200,400,200,400] : [200,100,200],
          data: d
        })
      );
    } catch(e) {}
  }
});

