// Firebase Cloud Messaging Service Worker
// This file must be in the public folder and named exactly "firebase-messaging-sw.js"

importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDHgmV-q-pM_ISr4k5Hw4ia2xL876sEXTA",
  authDomain: "pantry-c9a16.firebaseapp.com",
  projectId: "pantry-c9a16",
  storageBucket: "pantry-c9a16.firebasestorage.app",
  messagingSenderId: "438099088507",
  appId: "1:438099088507:web:faffd1a738844d26323ede"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/icon.png',
    badge: '/icon.png',
    tag: payload.data?.type || 'notification',
    data: payload.data,
    requireInteraction: false,
    vibrate: [200, 100, 200]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked', event);
  
  event.notification.close();

  // Handle navigation based on notification type
  const notificationData = event.notification.data || {};
  let urlToOpen = '/';

  if (notificationData.type === 'friend_post' && notificationData.postId) {
    urlToOpen = `/post/${notificationData.postId}`;
  } else if (notificationData.type === 'friend_goal' && notificationData.userId) {
    urlToOpen = `/profile/${notificationData.userId}`;
  } else if (notificationData.type === 'daily-reminder') {
    urlToOpen = '/log';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
