import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Android Notification Channels Configuration
 * iOS doesn't use channels - this is Android-only
 */

export const CHANNELS = {
  DAILY_REMINDERS: {
    id: 'daily-reminders',
    name: 'Daily Cooking Reminders',
    description: 'Notifications for your daily cooking goals',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF6B6B',
  },
  FRIEND_ACTIVITY: {
    id: 'friend-activity',
    name: 'Friend Activity',
    description: 'Notifications when your friends post or complete goals',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4ECDC4',
  },
  ACHIEVEMENTS: {
    id: 'achievements',
    name: 'Achievements & Milestones',
    description: 'Notifications for your cooking achievements and badges',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FFD93D',
  },
  SOCIAL: {
    id: 'social',
    name: 'Social',
    description: 'Comments, likes, and other social interactions',
    importance: Notifications.AndroidImportance.LOW,
    sound: 'default',
    lightColor: '#95E1D3',
  },
};

/**
 * Set up all notification channels for Android
 * Call this once when the app starts
 */
export async function setupNotificationChannels() {
  if (Platform.OS !== 'android') {
    console.log('Notification channels are Android-only');
    return;
  }

  try {
    // Create all channels
    for (const channel of Object.values(CHANNELS)) {
      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        description: channel.description,
        importance: channel.importance,
        sound: channel.sound,
        vibrationPattern: channel.vibrationPattern,
        lightColor: channel.lightColor,
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });
    }

    console.log('✅ Notification channels created successfully');
  } catch (error) {
    console.error('❌ Error setting up notification channels:', error);
  }
}

/**
 * Get channel ID for a notification type
 */
export function getChannelId(notificationType) {
  switch (notificationType) {
    case 'daily-reminder':
    case 'weekly-reminder':
      return CHANNELS.DAILY_REMINDERS.id;
    
    case 'friend-post':
    case 'friend-goal-complete':
      return CHANNELS.FRIEND_ACTIVITY.id;
    
    case 'badge-earned':
    case 'milestone':
      return CHANNELS.ACHIEVEMENTS.id;
    
    case 'comment':
    case 'like':
    case 'follow':
      return CHANNELS.SOCIAL.id;
    
    default:
      return CHANNELS.DAILY_REMINDERS.id;
  }
}

/**
 * Delete a notification channel (use with caution)
 */
export async function deleteNotificationChannel(channelId) {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    await Notifications.deleteNotificationChannelAsync(channelId);
    console.log(`Deleted channel: ${channelId}`);
  } catch (error) {
    console.error('Error deleting channel:', error);
  }
}

/**
 * Get all notification channels
 */
export async function getAllChannels() {
  if (Platform.OS !== 'android') {
    return [];
  }

  try {
    const channels = await Notifications.getNotificationChannelsAsync();
    return channels;
  } catch (error) {
    console.error('Error getting channels:', error);
    return [];
  }
}

export default {
  CHANNELS,
  setupNotificationChannels,
  getChannelId,
  deleteNotificationChannel,
  getAllChannels,
}