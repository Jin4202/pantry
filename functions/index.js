const functions = require("firebase-functions");
const {onDocumentWritten, onDocumentCreated} = require("firebase-functions/v2/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const {onCall} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Initialize the Admin SDK once for the project
const app = admin.initializeApp();
const db = getFirestore(app, "pantry1");

// ========================================
// PUSH NOTIFICATION HELPER FUNCTIONS
// ========================================

/**
 * Get all FCM tokens for a user
 * @param {string} userId - The user ID
 * @return {Promise<Array<string>>} Array of FCM tokens
 */
async function getUserTokens(userId) {
  try {
    const tokensSnapshot = await db.collection("users").doc(userId).collection("fcmTokens").get();
    const tokens = [];

    tokensSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.token) {
        tokens.push(data.token);
      }
    });

    return tokens;
  } catch (error) {
    console.error(`Error getting tokens for user ${userId}:`, error);
    return [];
  }
}

/**
 * Send push notification to multiple tokens
 * @param {Array<string>} tokens - Array of FCM tokens
 * @param {Object} notification - Notification object with title and body
 * @param {Object} data - Additional data payload
 * @return {Promise<Object>} Result with success/failure counts
 */
async function sendPushNotification(tokens, notification, data = {}) {
  if (!tokens || tokens.length === 0) {
    console.log("No tokens to send notification to");
    return {successCount: 0, failureCount: 0};
  }

  const message = {
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: data,
    tokens: tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Successfully sent ${response.successCount} notifications`);
    console.log(`Failed to send ${response.failureCount} notifications`);

    // Clean up invalid tokens
    const tokensToRemove = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const error = resp.error;
        if (error.code === "messaging/invalid-registration-token" ||
            error.code === "messaging/registration-token-not-registered") {
          tokensToRemove.push(tokens[idx]);
        }
      }
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens: tokensToRemove,
    };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return {successCount: 0, failureCount: tokens.length, error};
  }
}

/**
 * Get user's friends list
 * @param {string} userId - The user ID
 * @return {Promise<Array<string>>} Array of friend user IDs
 */
async function getUserFriends(userId) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();
    return userData?.friends || [];
  } catch (error) {
    console.error(`Error getting friends for user ${userId}:`, error);
    return [];
  }
}

/**
 * Check if user has notifications enabled for a specific type
 * @param {string} userId - The user ID
 * @param {string} notificationType - Type of notification to check
 * @return {Promise<boolean>} Whether notifications are enabled
 */
async function hasNotificationsEnabled(userId, notificationType) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();
    const settings = userData?.notificationSettings || {};

    if (notificationType === "friend_activity") {
      return settings.friendActivity !== false; // Default to true
    }
    if (notificationType === "daily_reminder") {
      return settings.dailyReminders !== false; // Default to true
    }

    return true;
  } catch (error) {
    console.error(`Error checking notification settings for user ${userId}:`, error);
    return true; // Default to enabled
  }
}

// ========================================
// NOTIFICATION CLOUD FUNCTIONS
// ========================================

/**
 * Send push notification when a user creates a new post
 * Notifies all of the user's friends
 */
exports.notifyFriendsOnNewPost = onDocumentCreated({
  database: "pantry1",
  document: "feed/{postId}",
  region: "us-central1",
}, async (event) => {
  const snapshot = event.data;

  if (!snapshot) {
    console.log("No data found in event snapshot");
    return null;
  }

  const postData = snapshot.data();
  const authorId = postData.uid;
  const postId = event.params.postId;

  // Get author's display name
  const authorDoc = await db.collection("users").doc(authorId).get();
  const authorData = authorDoc.data();
  const authorName = authorData?.displayName || "A friend";

  // Get all friends of the author
  const friends = await getUserFriends(authorId);

  if (friends.length === 0) {
    console.log(`User ${authorId} has no friends to notify`);
    return null;
  }

  console.log(`Notifying ${friends.length} friends about new post from ${authorName}`);

  // Send notification to each friend
  const notificationPromises = friends.map(async (friendId) => {
    // Check if friend has friend activity notifications enabled
    const hasEnabled = await hasNotificationsEnabled(friendId, "friend_activity");
    if (!hasEnabled) {
      console.log(`User ${friendId} has friend activity notifications disabled`);
      return;
    }

    const tokens = await getUserTokens(friendId);
    const notification = {
      title: "New Post from " + authorName,
      body: postData.caption || "Check out their latest cooking creation!",
    };

    const data = {
      type: "friend_post",
      postId: postId,
      authorId: authorId,
      authorName: authorName,
    };

    // Save notification to Firestore
    await db.collection("users").doc(friendId).collection("notifications").add({
      title: notification.title,
      body: notification.body,
      type: data.type,
      postId: postId,
      authorId: authorId,
      authorName: authorName,
      read: false,
      timestamp: FieldValue.serverTimestamp(),
    });

    // Send push notification if user has tokens
    if (tokens.length > 0) {
      return sendPushNotification(tokens, notification, data);
    }
  });

  await Promise.all(notificationPromises);
  console.log("Finished sending friend post notifications");

  return null;
});

/**
 * Send push notification when a user completes their weekly goal
 * Notifies all of the user's friends
 */
exports.notifyFriendsOnGoalComplete = onDocumentWritten({
  database: "pantry1",
  document: "users/{userId}",
  region: "us-central1",
}, async (event) => {
  const change = event.data;

  if (!change) {
    console.log("No data change found");
    return null;
  }

  const before = change.before.data();
  const after = change.after.data();
  const userId = event.params.userId;

  // Check if the user just met their goal
  const goalJustMet = !before?.hasGoalBeenMetThisWeek && after?.hasGoalBeenMetThisWeek;

  if (!goalJustMet) {
    return null; // Goal wasn't just completed
  }

  console.log(`User ${userId} just completed their weekly goal!`);

  const userName = after.displayName || "A friend";
  const weeklyGoal = after.weeklyGoal || 0;

  // Get all friends
  const friends = await getUserFriends(userId);

  if (friends.length === 0) {
    console.log(`User ${userId} has no friends to notify`);
    return null;
  }

  console.log(`Notifying ${friends.length} friends about goal completion`);

  // Send notification to each friend
  const notificationPromises = friends.map(async (friendId) => {
    const hasEnabled = await hasNotificationsEnabled(friendId, "friend_activity");
    if (!hasEnabled) {
      return;
    }

    const tokens = await getUserTokens(friendId);

    const notification = {
      title: userName + " achieved their weekly goal! 🎉",
      body: `They completed ${weeklyGoal} cooking sessions this week`,
    };

    const data = {
      type: "friend_goal",
      userId: userId,
      userName: userName,
      weeklyGoal: String(weeklyGoal),
    };

    // Save notification to Firestore
    await db.collection("users").doc(friendId).collection("notifications").add({
      title: notification.title,
      body: notification.body,
      type: data.type,
      userId: userId,
      userName: userName,
      read: false,
      timestamp: FieldValue.serverTimestamp(),
    });

    // Send push notification if user has tokens
    if (tokens.length > 0) {
      return sendPushNotification(tokens, notification, data);
    }
  });

  await Promise.all(notificationPromises);
  console.log("Finished sending goal completion notifications");

  return null;
});

/**
 * Send daily reminders to users who have them enabled
 * Runs every day at 9:00 AM UTC (adjust timezone as needed)
 * This is a BACKUP to local notifications
 */
exports.sendDailyReminders = onSchedule({
  schedule: "0 9 * * *", // 9:00 AM UTC every day
  timeZone: "UTC",
  region: "us-central1",
}, async (event) => {
  console.log("Starting daily reminder job");

  try {
    // Query users who have daily reminders enabled
    const usersSnapshot = await db.collection("users")
        .where("notificationSettings.dailyReminders", "==", true)
        .get();

    console.log(`Found ${usersSnapshot.size} users with daily reminders enabled`);

    const notificationPromises = [];

    for (const doc of usersSnapshot.docs) {
      const userId = doc.id;
      const userData = doc.data();
      const settings = userData.notificationSettings || {};

      // Check if today is in their reminder days
      const today = new Date()
          .toLocaleDateString("en-US", {weekday: "long"})
          .toLowerCase();
      const reminderDays = settings.reminderDays ||
          ["monday", "tuesday", "wednesday", "thursday", "friday"];

      if (!reminderDays.includes(today)) {
        console.log(`Skipping user ${userId} - not a reminder day`);
        continue;
      }

      const tokens = await getUserTokens(userId);
      if (tokens.length === 0) {
        console.log(`No tokens for user ${userId}`);
        continue;
      }

      const notification = {
        title: "Time to cook! 🍳",
        body: "Don't forget to complete your cooking goal today",
      };

      const data = {
        type: "daily-reminder",
        day: today,
      };

      notificationPromises.push(
          sendPushNotification(tokens, notification, data),
      );
    }

    const results = await Promise.all(notificationPromises);
    const totalSuccess = results.reduce((sum, r) => sum + (r?.successCount || 0), 0);
    const totalFailure = results.reduce((sum, r) => sum + (r?.failureCount || 0), 0);

    console.log(`Daily reminders sent: ${totalSuccess} success, ${totalFailure} failed`);

    return null;
  } catch (error) {
    console.error("Error in daily reminder job:", error);
    throw error;
  }
});

/**
 * Clean up old/expired FCM tokens
 * Runs once a week on Sundays at 2:00 AM UTC
 */
exports.cleanupOldTokens = onSchedule({
  schedule: "0 2 * * 0", // 2:00 AM UTC every Sunday
  timeZone: "UTC",
  region: "us-central1",
}, async (event) => {
  console.log("Starting token cleanup job");

  try {
    const usersSnapshot = await db.collection("users").get();
    let tokensDeleted = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const tokensSnapshot = await db.collection("users").doc(userId).collection("fcmTokens").get();

      for (const tokenDoc of tokensSnapshot.docs) {
        const tokenData = tokenDoc.data();
        const lastUsed = tokenData.lastUsed?.toDate() || tokenData.createdAt?.toDate();

        // Delete tokens not used in 30 days
        if (lastUsed && lastUsed < thirtyDaysAgo) {
          await tokenDoc.ref.delete();
          tokensDeleted++;
          console.log(`Deleted old token for user ${userId}`);
        }
      }
    }

    console.log(`Token cleanup complete. Deleted ${tokensDeleted} old tokens`);
    return null;
  } catch (error) {
    console.error("Error in token cleanup job:", error);
    throw error;
  }
});

exports.updateDenormalizedUserData = onDocumentWritten({
  database: "pantry1",
  region: "us-central1",
  document: "users/{userId}",
}, async (event) => {
  const change = event.data;

  if (!change) {
    console.log("No data change found.");
    return null;
  }

  const userId = event.params.userId;
  const newData = change.after.data();
  const previousData = change.before.data();

  // 1. Identify what changed
  const newDisplayName = newData.displayName;
  const newPhotoURL = newData.photoURL;
  const oldDisplayName = previousData.displayName;
  const oldPhotoURL = previousData.photoURL;

  // We only proceed if the displayName or photoURL has changed
  const displayNameChanged = newDisplayName !== oldDisplayName;
  const photoURLChanged = newPhotoURL !== oldPhotoURL;

  if (!displayNameChanged && !photoURLChanged) {
    console.log("No relevant changes to displayName or photoURL. Exiting.");
    return null;
  }

  console.log(`Updating denormalized data for user: ${userId}`);
  console.log("displayNameChanged:", displayNameChanged);
  console.log("photoURLChanged:", photoURLChanged);

  // Data structure to apply to all posts/comments
  const updatePayload = {};
  if (displayNameChanged) {
    updatePayload.displayName = newDisplayName;
  }
  if (photoURLChanged) {
    updatePayload.displayPhoto = newPhotoURL; // Assuming 'displayPhoto' is used in posts
  }
  console.log("updatePayload:", updatePayload);
  console.log("about to batch");
  const batch = db.batch();
  let documentsUpdated = 0;
  console.log("just finished batch:", batch);

  // --- 2. Update the User's Posts in the Global 'feed' Collection ---
  // Query for all documents in 'feed' where the 'uid' matches the user ID
  const feedPostsSnapshot = await db.collection("feed")
      .where("uid", "==", userId)
      .get();

  console.log("about to update feed");
  feedPostsSnapshot.forEach((doc) => {
    batch.update(doc.ref, updatePayload);
    documentsUpdated++;
  });
  console.log("finished updating user post");
  console.log("user posts:", feedPostsSnapshot);

  // --- 3. Update the User's Comments in all Post Subcollections ---
  // This is the most complex step as it requires a Collection Group Query.
  // NOTE: This requires a Firestore index. See next section.
  const commentsSnapshot = await db.collectionGroup("comments")
      .where("uid", "==", userId)
      .get();

  console.log("about to update comments");
  commentsSnapshot.forEach((doc) => {
  // Comments only need displayName
    const commentUpdate = {};
    if (displayNameChanged) {
      commentUpdate.displayName = newDisplayName;
    }
    // Only update if there are fields to change
    if (Object.keys(commentUpdate).length > 0) {
      batch.update(doc.ref, commentUpdate);
      documentsUpdated++;
    }
  });

  console.log("finished updating comments");
  console.log("comments:", commentsSnapshot);

  // --- 5. Commit the batch and return ---
  if (documentsUpdated > 0) {
    await batch.commit();
    console.log(`Successfully completed batch update for ${documentsUpdated} documents.`);
  } else {
    console.log("No documents found to update.");
  }

  return null;
});

// Helper to determine the start of the calendar week (Sunday 00:00:00)
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff); // Set the date to Sunday's date
  d.setHours(0, 0, 0, 0); // Set time to midnight
  return d;
};

exports.updateStreakOnNewPost = onDocumentCreated({
  database: "pantry1",
  document: "feed/{postId}",
  region: "us-central1",
}, async (event) => {
  const snapshot = event.data;

  if (!snapshot) {
    console.log("No data found in event snapshot.");
    return null;
  }

  const postData = snapshot.data();
  const userId = postData.uid;
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  // Basic check to ensure user data exists
  if (!userDoc.exists || !userData) {
    console.log(`User ${userId} not found or has no data. Cannot update streak.`);
    return null;
  }

  // 1. Get the current post's time (server's time in UTC)
  const now = new Date();

  // 2. Get the recorded streak start date (the Sunday midnight timestamp set by the client)
  const lastStartTimestamp = userData.streakStartDate;
  const lastRecordedStart = lastStartTimestamp ? lastStartTimestamp.toDate() : null;

  // 3. Calculate the Sunday midnight for the time the post was made (in UTC)
  const currentWeekStart = getStartOfWeek(now).getTime();

  // 4. Calculate the Sunday midnight for the recorded streak start (in UTC)
  // This value should be the exact Sunday midnight timestamp sent by the client.
  const lastWeekStart = lastRecordedStart ? getStartOfWeek(lastRecordedStart).getTime() : 0;

  // Check if the current calendar week start is LATER than the recorded week start
  const isNewWeek = currentWeekStart > lastWeekStart;

  // streak calculation
  let newCurrentWeekPosts = userData.currentWeekPosts || 0;
  let newStreakCount = userData.streakCount || 0;
  let newStreakStartDate = userData.streakStartDate;

  let hasMetGoal = userData.hasGoalBeenMetThisWeek || false;
  const weeklyGoal = userData.weeklyGoal || 0;

  if (isNewWeek) {
    newCurrentWeekPosts = 1;
    newStreakStartDate = admin.firestore.Timestamp.fromDate(getStartOfWeek(now));
    hasMetGoal = false; // Reset the flag for the new week
  } else {
    newCurrentWeekPosts += 1; // If NOT a new week, just increment the posts
  }

  if (!hasMetGoal && newCurrentWeekPosts >= weeklyGoal) {
    // Goal is being met with this new post, AND the streak hasn't been incremented yet
    newStreakCount += 1;
    hasMetGoal = true; // Set the flag to prevent double-counting this week's goal
    console.log(`GOAL MET! Streak incremented immediately to ${newStreakCount}.`);
  }

  // 3. Update the user document
  await userRef.update({
    currentWeekPosts: newCurrentWeekPosts,
    streakCount: newStreakCount,
    streakStartDate: newStreakStartDate,
    hasGoalBeenMetThisWeek: hasMetGoal,
  });

  console.log(`Streak updated for user ${userId}.`);
  console.log(`Posts: ${newCurrentWeekPosts}, Streak: ${newStreakCount}`);
  return null;
});

// Check and reset streaks for ALL users weekly.
exports.resetWeeklyStreak = onSchedule({
  schedule: "5 0 * * 1", // Runs at 00:05 AM UTC every Monday
  timeZone: "UTC",
  region: "us-central1",
}, async (event) => {
  console.log("Starting weekly streak reset job.");

  // Query ALL users, regardless of their current goal status
  const usersRef = db.collection("users");
  const snapshot = await usersRef.get(); // Fetch ALL users

  let batch = db.batch();
  let batchCount = 0;
  let documentsProcessed = 0;

  for (const doc of snapshot.docs) {
    const userRef = doc.ref;
    const userData = doc.data();

    // --- Determine if the streak should reset ---
    let newStreakCount = userData.streakCount || 0;
    const previousGoalMet = userData.hasGoalBeenMetThisWeek || false;

    if (!previousGoalMet) {
      // If the goal was NOT met in the last recorded week, reset the streak.
      newStreakCount = 0;
      console.log(`User ${doc.id} missed goal. Streak reset.`);
    }

    // --- Apply the weekly reset for the NEW week ---
    batch.update(userRef, {
      // Reset the posts and goal status for the new week (Nov 16th week)
      weeklyGoal: 0,
      currentWeekPosts: 0,
      hasGoalBeenMetThisWeek: false,
      streakCount: newStreakCount,
    });

    batchCount++;
    documentsProcessed++;

    if (batchCount >= 499) {
      await batch.commit();
      batchCount = 0;
      batch = db.batch();
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`Successfully completed streak and progress reset 
    for ${documentsProcessed} total users.`);
  return null;
});

// Assigns a new user to Group A or Group B based on which group has fewer members.
exports.assignABGroup = onCall({
  region: "us-central1",
  enforceAppCheck: false, // Set to true if you use App Check
}, async (request) => {
  // 1. Get the authenticated user's ID
  const userId = request.auth.uid;
  if (!userId) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated.",
    );
  }

  const countersRef = db.collection("abTestCounters").doc("userSplit");
  const userProfileRef = db.collection("users").doc(userId);
  let assignedGroup = null;

  // --- 2. Run Atomic Transaction to Assign Group ---
  try {
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(countersRef);

      // Initialize counters if the document doesn't exist
      if (!doc.exists) {
        // Initialize with 0 and assign the very first user to Group A
        transaction.set(countersRef, {groupA_count: 0, groupB_count: 0});
        assignedGroup = "Group A";
        transaction.update(countersRef, {groupA_count: admin.firestore.FieldValue.increment(1)});
        return;
      }

      const data = doc.data();
      const countA = data.groupA_count || 0;
      const countB = data.groupB_count || 0;

      // Assign to the group with fewer (or equal) members
      if (countA <= countB) {
        assignedGroup = "Group A";
        transaction.update(countersRef, {groupA_count: admin.firestore.FieldValue.increment(1)});
      } else {
        assignedGroup = "Group B";
        transaction.update(countersRef, {groupB_count: admin.firestore.FieldValue.increment(1)});
      }
    });

    // --- 3. Update the User's Profile Outside the Transaction ---
    if (assignedGroup) {
      await userProfileRef.set({
        abTestGroup: assignedGroup,
        // Merging to ensure we don't overwrite existing profile data
        abTestAssignmentDate: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});

      console.log(`User ${userId} assigned to ${assignedGroup}.`);

      return {
        status: "success",
        group: assignedGroup,
        message: `User assigned to ${assignedGroup}.`,
      };
    }
  } catch (error) {
    console.error("A/B Group Assignment failed:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Failed to assign A/B group due to a server error.",
    );
  }
});

// Journal count trigger
exports.updateJournalCountOnCreate = onDocumentCreated(
    "journals/{journalId}",
    async (event) => {
      const data = event.data.data();
      const userId = data.uid;

      if (!userId) {
        console.log("Journal entry lacks a UID, skipping count update.");
        return;
      }

      const userRef = db.collection("users").doc(userId);

      try {
        await userRef.update({
          journalCount: FieldValue.increment(1),
        });
        console.log(`Journal count incremented for user: ${userId}`);
      } catch (error) {
        if (error.code === "not-found" || error.message.includes("No document to update")) {
          await userRef.set({journalCount: 1}, {merge: true});
          console.log(`Journal count initialized to 1 for user: ${userId}`);
        } else {
          console.error(`Error updating journal count for ${userId}:`, error);
        }
      }
    },
);


// Photo/Post count trigger
exports.updatePhotoCountOnCreate = onDocumentCreated(
    // Listen to the 'feed' collection for new posts
    "feed/{postId}",
    async (event) => {
      const data = event.data.data();
      const userId = data.uid;

      if (!userId) {
        console.log("Feed post lacks a UID, skipping count update.");
        return;
      }

      const userRef = db.collection("users").doc(userId);

      try {
        // Atomically increment the photoCount field by 1
        await userRef.update({
          photoCount: FieldValue.increment(1),
        });
        console.log(`Photo count incremented for user: ${userId}`);
      } catch (error) {
        // Handle initialization if the field doesn't exist
        if (error.code === "not-found" || error.message.includes("No document to update")) {
          await userRef.set({photoCount: 1}, {merge: true});
          console.log(`Photo count initialized to 1 for user: ${userId}`);
        } else {
          console.error(`Error updating photo count for ${userId}:`, error);
        }
      }
    },
);
