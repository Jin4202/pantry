# First-Prototype
1. download into vs code
2. run npm install in terminal
3. run npx expo install expo-linking
4. put env variables in .env file (place .env file in project root)
-- .env values, paste the following lines directly
into created .env file: (values given to team individually)
5. run npx expo start -c to start simulation, emulator can be set up and run with this as well.


## 🔔 Notification System

This app supports multi-platform push notifications:
- ✅ **Android** - Native push notifications via Expo + FCM
- ✅ **Web** - Browser push notifications via Firebase Cloud Messaging
- ❌ **iOS** - Not currently supported

### Quick Setup
For web notifications setup, see: [WEB_NOTIFICATIONS_SETUP.md](./WEB_NOTIFICATIONS_SETUP.md)
For migration details, see: [NOTIFICATION_MIGRATION_SUMMARY.md](./NOTIFICATION_MIGRATION_SUMMARY.md)
