# Pantry

> A social cooking tracker where users log meals, build streaks, and stay accountable through communities and friends.

Built with **React Native (Expo)** on the frontend and **Firebase Cloud Functions** on the backend. The backend handles event-driven notifications, atomic A/B testing, scheduled jobs, and real-time data sync at scale.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Client (React Native)                  │
│  Home · Log · Explore · Communities · Profile           │
└──────────────────────┬──────────────────────────────────┘
                       │ Firestore real-time listeners
                       ▼
┌─────────────────────────────────────────────────────────┐
│               Firebase Cloud Firestore                   │
│  /users   /feed   /communities   /journals   /abTest... │
└──────┬──────────────────────┬───────────────────────────┘
       │ Document triggers     │ Scheduled triggers
       ▼                       ▼
┌─────────────────────────────────────────────────────────┐
│              Firebase Cloud Functions (Node.js)          │
│                                                         │
│  onDocumentCreated  ──►  Streak Engine                  │
│  onDocumentCreated  ──►  Friend Notification Pipeline   │
│  onDocumentWritten  ──►  Denormalized Data Sync         │
│  onDocumentWritten  ──►  Goal Completion Alerts         │
│  onSchedule (daily) ──►  Daily Reminder Broadcast       │
│  onSchedule (weekly)──►  Streak Reset + Cleanup         │
│  onCall             ──►  Atomic A/B Group Assignment    │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
              Firebase Cloud Messaging (FCM)
              Multicast push to all user devices
```

---

## Backend Highlights

### 1. Event-Driven Notification Pipeline
Every new post in `/feed` triggers `notifyFriendsOnNewPost`, which fans out push notifications to all of the author's friends — only to those with `friendActivity` notifications enabled. Invalid FCM tokens are detected from the multicast response and queued for removal.

```js
// functions/index.js
exports.notifyFriendsOnNewPost = onDocumentCreated({ document: "feed/{postId}" }, async (event) => {
  const friends = await getUserFriends(authorId);
  const notificationPromises = friends.map(async (friendId) => {
    const tokens = await getUserTokens(friendId);
    return sendPushNotification(tokens, notification, data);
  });
  await Promise.all(notificationPromises);
});
```

### 2. Atomic A/B Test Group Assignment
New users are assigned to Group A or Group B via a **Firestore transaction** — guaranteeing a balanced 50/50 split even under concurrent signups. No race conditions, no skew.

```js
exports.assignABGroup = onCall(async (request) => {
  await db.runTransaction(async (transaction) => {
    const { groupA_count, groupB_count } = doc.data();
    assignedGroup = countA <= countB ? "Group A" : "Group B";
    transaction.update(countersRef, { [`${assignedGroup}_count`]: FieldValue.increment(1) });
  });
});
```
Analytics events (`pantry_post_created`, `weekly_goal_set`) are tagged with `ab_test_group` so product metrics can be segmented per cohort in Google Analytics 4.

### 3. Scheduled Background Jobs
Three cron jobs run server-side with no client involvement:

| Function | Schedule | Purpose |
|---|---|---|
| `sendDailyReminders` | `0 9 * * *` | Push reminders to opted-in users on their selected days |
| `resetWeeklyStreak` | `0 0 * * 1` | Evaluate and reset streaks for all users every Monday |
| `cleanupOldTokens` | `0 2 * * 0` | Delete FCM tokens unused for 30+ days |

`resetWeeklyStreak` processes all users in **Firestore batch writes** (capped at 499 ops/batch) to stay within API limits.

### 4. Denormalized Data Consistency
When a user updates their `displayName` or `photoURL`, a `onDocumentWritten` trigger propagates the change across:
- All their posts in the global `/feed` collection
- All their comments via a **Firestore Collection Group Query** on `comments`

This is done in a single atomic batch commit, keeping denormalized copies consistent without client-side coordination.

### 5. Server-Side Streak Engine
Streak logic lives in Cloud Functions, not the client. On each new post:
- Detects week boundaries using UTC Sunday-midnight timestamps
- Increments `currentWeekPosts`, evaluates against `weeklyGoal`
- Atomically updates `streakCount` and `hasGoalBeenMetThisWeek` to prevent double-counting

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile Client | React Native, Expo Router, Expo Notifications |
| Backend | Firebase Cloud Functions v2 (Node.js) |
| Database | Cloud Firestore (multi-collection, real-time) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Storage | Firebase Storage |
| Auth | Firebase Authentication |
| Analytics | Firebase Analytics / Google Analytics 4 |

---

## Features

- **Meal Logging** — Photo + caption posts with public/private visibility
- **Weekly Goal & Streaks** — Set a weekly cooking goal; server-side streak tracking with weekly resets
- **Community Feed** — Real-time global feed via Firestore `onSnapshot`
- **Communities** — Create public or private groups (private ones use invite codes)
- **Badge System** — Unlock badges for milestones (meals, streaks, journal entries)
- **Push Notifications** — Friend activity alerts, daily cooking reminders, goal completion celebrations
- **A/B Testing** — Server-assigned cohorts with analytics instrumentation to measure feature impact
- **Journal** — Private cooking notes separate from the public feed

---

## Local Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root with your Firebase credentials (see `.env.example` if available, or request values from the team).

3. Start the development server:
   ```bash
   npx expo start -c
   ```

4. Deploy Cloud Functions:
   ```bash
   cd functions && npm install
   firebase deploy --only functions
   ```

> **Note:** Push notifications require a physical device (Android or iOS). The iOS build is not currently configured.

---

## Project Structure

```
pantry/
├── app/
│   ├── tabs/           # Screen components (Home, Log, Communities, Profile, Explore)
│   ├── components/     # Shared + screen-specific UI components
│   ├── services/       # NotificationService (FCM token management, local scheduling)
│   └── utils/          # Badge logic, analytics helpers, image upload
├── functions/
│   └── index.js        # All Cloud Functions (triggers, schedules, callable)
├── firebaseConfig.js   # Firebase SDK initialization
└── public/
    └── firebase-messaging-sw.js  # Web push service worker
```
