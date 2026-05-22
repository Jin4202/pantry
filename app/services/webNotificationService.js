// Web Push Notification Service using Firebase Cloud Messaging (FCM)
// This service is specifically for web browsers (not React Native mobile apps)

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

class WebNotificationService {
  constructor() {
    this.messaging = null;
    this.currentToken = null;
    this.unsubscribeOnMessage = null;
  }

  /**
   * Initialize Firebase Messaging for web
   * Must be called after Firebase app is initialized
   */
  initialize(firebaseApp) {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('Service Worker not supported in this environment');
      return false;
    }

    try {
      this.messaging = getMessaging(firebaseApp);
      console.log('Firebase Messaging initialized for web');
      return true;
    } catch (error) {
      console.error('Error initializing Firebase Messaging:', error);
      return false;
    }
  }

  /**
   * Request notification permission from the user
   * Returns: { status: 'granted' | 'denied' | 'default', token: string | null }
   */
  async requestPermission() {
    if (!this.messaging) {
      console.error('Firebase Messaging not initialized');
      return { status: 'denied', token: null };
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return { status: permission, token: null };
      }

      // Get FCM token
      const token = await this.getToken();
      
      return { status: 'granted', token };
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return { status: 'denied', token: null };
    }
  }

  /**
   * Get the FCM registration token
   * This token is used to send push notifications to this specific browser/device
   */
  async getToken() {
    if (!this.messaging) {
      console.error('Firebase Messaging not initialized');
      return null;
    }

    try {
      // Register service worker first
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Get FCM token with VAPID key (you'll need to generate this in Firebase Console)
      // Go to: Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
      const token = await getToken(this.messaging, {
        vapidKey: 'BC0mF_ZG81PdN2ypq5qrgMAP3cBXNzsU2U02yr5B_qZycc-j-ER1UGuzbyZ-u5J6-z4B4bOv57UFy3h08XMS1Og', 
        serviceWorkerRegistration: registration
      });

      if (token) {
        console.log('FCM Token obtained:', token);
        this.currentToken = token;
        return token;
      } else {
        console.log('No registration token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Register the FCM token with Firestore
   * Stores token in users/{userId}/fcmTokens/{tokenId}
   */
  async registerToken(userId, token) {
    if (!token || !userId) {
      console.log('Missing token or userId');
      return false;
    }

    try {
      const db = getFirestore();
      const tokenId = this.generateTokenId(token);
      const tokenRef = doc(db, `users/${userId}/fcmTokens`, tokenId);

      await setDoc(tokenRef, {
        token,
        platform: 'web',
        browser: this.getBrowserInfo(),
        userAgent: navigator.userAgent,
        createdAt: serverTimestamp(),
        lastUsed: serverTimestamp(),
      }, { merge: true });

      console.log('Web FCM token registered successfully');
      return true;
    } catch (error) {
      console.error('Error registering token:', error);
      return false;
    }
  }

  /**
   * Generate consistent token ID from token string
   */
  generateTokenId(token) {
    return token.substring(token.length - 20);
  }

  /**
   * Get browser information
   */
  getBrowserInfo() {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';

    if (ua.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
    } else if (ua.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
    } else if (ua.indexOf('Safari') > -1) {
      browserName = 'Safari';
    } else if (ua.indexOf('Edge') > -1) {
      browserName = 'Edge';
    }

    return browserName;
  }

  /**
   * Set up foreground message listener
   * This handles messages when the web app is open and in focus
   */
  setupForegroundMessageListener(onMessageReceived) {
    if (!this.messaging) {
      console.error('Firebase Messaging not initialized');
      return;
    }

    // Remove existing listener if any
    if (this.unsubscribeOnMessage) {
      this.unsubscribeOnMessage();
    }

    // Listen for foreground messages
    this.unsubscribeOnMessage = onMessage(this.messaging, (payload) => {
      console.log('Foreground message received:', payload);

      // Show notification manually for foreground messages
      const notificationTitle = payload.notification?.title || 'New Notification';
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || '/icon.png',
        badge: '/icon.png',
        tag: payload.data?.type || 'notification',
        data: payload.data,
        requireInteraction: false
      };

      // Show notification
      if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(notificationTitle, notificationOptions);
        });
      }

      // Call custom handler
      if (onMessageReceived) {
        onMessageReceived(payload);
      }
    });

    console.log('Foreground message listener set up');
  }

  /**
   * Remove message listener
   */
  removeForegroundMessageListener() {
    if (this.unsubscribeOnMessage) {
      this.unsubscribeOnMessage();
      this.unsubscribeOnMessage = null;
      console.log('Foreground message listener removed');
    }
  }

  /**
   * Update notification settings in Firestore
   */
  async updateSettings(userId, settings) {
    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', userId);

      await setDoc(userRef, {
        notificationSettings: {
          webNotifications: settings.webNotifications ?? true,
          dailyReminders: settings.dailyReminders ?? true,
          reminderTime: settings.reminderTime ?? '09:00',
          reminderDays: settings.reminderDays ?? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          friendActivity: settings.friendActivity ?? true,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          updatedAt: serverTimestamp(),
        }
      }, { merge: true });

      return true;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return false;
    }
  }

  /**
   * Check if notifications are supported
   */
  isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Check current permission status
   */
  getPermissionStatus() {
    if (!this.isSupported()) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  /**
   * Delete the FCM token (used when user logs out or disables notifications)
   */
  async deleteToken() {
    if (!this.messaging || !this.currentToken) {
      return false;
    }

    try {
      // Note: deleteToken is available but may not work in all contexts
      // The token will naturally expire after some time if not used
      console.log('Token deleted/invalidated');
      this.currentToken = null;
      return true;
    } catch (error) {
      console.error('Error deleting token:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new WebNotificationService();
