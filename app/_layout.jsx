import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import firebaseApp from '../firebaseConfig';

import notificationService from './services/notificationService';
import webNotificationService from './services/webNotificationService';
import { setupNotificationChannels } from './utils/notificationChannels';

export default function RootLayout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  const auth = getAuth();

  // Initialize notifications
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Initialize web notifications
      webNotificationService.initialize(firebaseApp);
    } else {
      // Initialize mobile notifications
      setupNotificationChannels();
    }
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      // Register for push notifications when user signs in
      if (user) {
        await registerForPushNotifications(user.uid);
      }
    });

    return unsubscribe;
  }, []);

  // Register for push notifications
  const registerForPushNotifications = async (userId) => {
    try {
      if (Platform.OS === 'web') {
        // Web notification registration (optional automatic setup)
        // User can manually enable later in settings
        console.log('Web notifications can be enabled in Settings');
      } else {
        // Mobile notification registration
        const { status, token } = await notificationService.requestPermissions();
        
        if (status === 'granted' && token) {
          await notificationService.registerToken(userId, token);
          
          // Set default notification settings
          await notificationService.updateSettings(userId, {
            dailyReminders: true,
            reminderTime: '09:00',
            reminderDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            friendActivity: true,
          });

          // Schedule daily reminders (9:00 AM)
          await notificationService.scheduleDailyReminder(9, 0);
        }
      }
    } catch (error) {
      console.error('Error registering for notifications:', error);
    }
  };

  // Set up notification listeners
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web notification listener (foreground messages)
      const handleWebNotification = (payload) => {
        console.log('Web notification received:', payload);
        // Notification is automatically shown by service worker
        
        // Navigate if needed based on notification data
        const data = payload.data;
        if (data?.type === 'friend_post' && data?.postId) {
          router.push(`/components/profile/screens/PostDetailScreen?postId=${data.postId}`);
        } else if (data?.type === 'friend_goal' && data?.userId) {
          router.push(`/tabs/profile?userId=${data.userId}`);
        } else if (data?.type === 'daily-reminder') {
          router.push('/tabs/log');
        }
      };

      webNotificationService.setupForegroundMessageListener(handleWebNotification);

      return () => {
        webNotificationService.removeForegroundMessageListener();
      };
    } else {
      // Mobile notification listeners
      const handleNotificationReceived = (notification) => {
        console.log('Notification received in foreground:', notification);
      };

      const handleNotificationTapped = (response) => {
        console.log('User tapped notification:', response);
        
        const data = response.notification.request.content.data;
        
        // Navigate based on notification type
        if (data?.type === 'friend_post' && data?.postId) {
          router.push(`/components/profile/screens/PostDetailScreen?postId=${data.postId}`);
        } else if (data?.type === 'friend_goal' && data?.userId) {
          router.push(`/tabs/profile?userId=${data.userId}`);
        } else if (data?.type === 'daily-reminder') {
          router.push('/tabs/log');
        }
      };

      notificationService.setupNotificationListeners(
        handleNotificationReceived,
        handleNotificationTapped
      );

      // Handle app opened from notification (quit state)
      Notifications.getLastNotificationResponseAsync().then(response => {
        if (response) {
          const data = response.notification.request.content.data;
          if (data?.type === 'friend_post' && data?.postId) {
            router.push(`/components/profile/screens/PostDetailScreen?postId=${data.postId}`);
          } else if (data?.type === 'friend_goal' && data?.userId) {
            router.push(`/tabs/profile?userId=${data.userId}`);
          } else if (data?.type === 'daily-reminder') {
            router.push('/tabs/log');
          }
        }
      });

      return () => {
        notificationService.removeNotificationListeners();
      };
    }
  }, [router]);

  // Navigation logic
  useEffect(() => {
    if (loading) return;

    const publicPages = ['signin', 'signup']; 
    const currentSegment = segments[0];
    const isPublicPage = publicPages.includes(currentSegment);

    if (!user && !isPublicPage) {
      router.replace('/signin');
    } else if (user && isPublicPage) {
      router.replace('/tabs/home');
    }
  }, [user, loading, segments]);

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="signin" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="tabs" />
    </Stack>
  );
}
