// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  projectId: "gen-lang-client-0921556029",
  appId: "1:246817212666:web:0b953aa133eb8356cca143",
  apiKey: "AIzaSyAutrx5xoNm5nC-E4bWaTtZY2hXzVuIEoc",
  authDomain: "gen-lang-client-0921556029.firebaseapp.com",
  storageBucket: "gen-lang-client-0921556029.firebasestorage.app",
  messagingSenderId: "246817212666"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'Barbflow';
  const notificationOptions = {
    body: payload.notification?.body || 'Você tem uma nova atualização no Barbflow.',
    icon: '/favicon.ico',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
