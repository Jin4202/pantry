import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';


// Behavior for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    // Check permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Permission required for notifications!');
      return null;
    }

    // Get token
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Expo push token:", token);
  } else {
    alert("You need a physical device for push notifications.");
  }

  return token;
}

export async function savePushTokenToFirestore(token) {
  const user = auth.currentUser;
  if (token && user) {
    try {
      await setDoc(doc(db, 'users', user.uid), { expoPushToken: token }, { merge: true });
      console.log('Expo push token saved to Firestore');
    } catch (err) {
      console.error('Error saving push token:', err);
    }
  }
}

export async function setupNotificationsForUser() {
  const token = await registerForPushNotificationsAsync();
  if (token) {
    await savePushTokenToFirestore(token);
  }
}
