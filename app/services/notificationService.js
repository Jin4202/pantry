import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getFirestore, doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
  }

  /**
   * Request notification permissions
   * Returns: { status: 'granted' | 'denied', token: string | null }
   */
  async requestPermissions() {
    try {
      // Check if device is physical (not simulator)
      if (!Device.isDevice) {
        console.log('Notifications only work on physical devices');
        return { status: 'denied', token: null };
      }

      // Check current permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission denied');
        return { status: 'denied', token: null };
      }

      // Get Expo push token (this will get FCM token internally)
      const token = await this.getExpoPushToken();
      
      return { status: 'granted', token };
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return { status: 'denied', token: null };
    }
  }

  /**
   * Get Expo Push Token (wraps FCM for both platforms)
   */
  async getExpoPushToken() {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? 
                       Constants.easConfig?.projectId;
      
      if (!projectId) {
        throw new Error('Project ID not found');
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      return tokenData.data; // This is your FCM token
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Register device token with Firestore
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
        platform: Platform.OS,
        deviceName: Device.deviceName || 'Unknown Device',
        osVersion: Device.osVersion || 'Unknown',
        createdAt: serverTimestamp(),
        lastUsed: serverTimestamp(),
      }, { merge: true });

      console.log('Token registered successfully');
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
    // Create a hash or use last 20 chars for ID
    return token.substring(token.length - 20);
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
   * Set up notification listeners
   * Call this in your root component (App.js or _layout.jsx)
   */
  setupNotificationListeners(onNotificationReceived, onNotificationTapped) {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      }
    );

    // Listener for when user taps notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        if (onNotificationTapped) {
          onNotificationTapped(response);
        }
      }
    );
  }

  /**
   * Clean up listeners
   */
  removeNotificationListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * Schedule a local notification (for daily reminders)
   */
  async scheduleLocalNotification(title, body, trigger, data = {}) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'daily-reminder',
        },
        trigger,
      });

      console.log('Local notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Schedule daily cooking reminder
   * Example: Schedule for 9:00 AM every day
   */
  async scheduleDailyReminder(hour = 9, minute = 0) {
    // Cancel existing daily reminders first
    await this.cancelAllScheduledNotifications();

    // Schedule for each day of the week
    const notificationIds = [];
    
    for (let weekday = 1; weekday <= 7; weekday++) {
      const trigger = {
        hour,
        minute,
        weekday, // 1 = Sunday, 2 = Monday, etc.
        repeats: true,
      };

      const id = await this.scheduleLocalNotification(
        'Time to cook! 🍳',
        'Don\'t forget to complete your cooking goal today',
        trigger,
        { type: 'daily-reminder' }
      );

      if (id) notificationIds.push(id);
    }

    return notificationIds;
  }

  /**
   * Schedule reminder at specific time on specific days
   */
  async scheduleCustomReminder(time, days = ['monday', 'wednesday', 'friday']) {
    await this.cancelAllScheduledNotifications();

    const [hour, minute] = time.split(':').map(Number);
    const dayMap = {
      sunday: 1,
      monday: 2,
      tuesday: 3,
      wednesday: 4,
      thursday: 5,
      friday: 6,
      saturday: 7,
    };

    const notificationIds = [];
    
    for (const day of days) {
      const weekday = dayMap[day.toLowerCase()];
      if (!weekday) continue;

      const trigger = {
        hour,
        minute,
        weekday,
        repeats: true,
      };

      const id = await this.scheduleLocalNotification(
        'Cooking reminder! 👨‍🍳',
        'Time to work on your cooking goals',
        trigger,
        { type: 'daily-reminder', day }
      );

      if (id) notificationIds.push(id);
    }

    return notificationIds;
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllScheduledNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All scheduled notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  /**
   * Cancel specific notification by ID
   */
  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getAllScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Get notification badge count
   */
  async getBadgeCount() {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  /**
   * Set notification badge count
   */
  async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Clear badge
   */
  async clearBadge() {
    await this.setBadgeCount(0);
  }
}

// Export singleton instance
export default new NotificationService();
