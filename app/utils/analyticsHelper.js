// src/utils/analyticsHelper.js (ADD THIS FUNCTION)

import { logEvent } from "firebase/analytics";
import { analytics } from '../../firebaseConfig';

/**
 * Logs a custom event for every successful post creation, tagged with the A/B group.
 * @param {string} abGroup - The user's assigned group ('Group A' or 'Group B').
 */
export const logPostCreation = (abGroup) => {
    const eventName = 'pantry_post_created'; // A clear event name
    
    if (analytics) {
        logEvent(analytics, eventName, {
            // CRITICAL: Tagging the post with the user's A/B group
            ab_test_group: abGroup, 
        });
        console.log(`[Analytics] Logged post creation for Group ${abGroup}`);
    } else {
        console.warn("Firebase Analytics is not initialized. Cannot log post event.");
    }
};

/**
 * Logs a custom event to Google Analytics, tagging it with the user's A/B group.
 * @param {string} abGroup - The user's assigned group ('Group A' or 'Group B').
 */
export const logWeeklyGoalSubmission = (abGroup) => {
    const eventName = 'weekly_goal_set'; // Define the event name for your goal
    
    if (analytics) {
        logEvent(analytics, eventName, {
            // CRITICAL: This custom parameter segments your A/B test data in GA
            ab_test_group: abGroup, 
            platform: 'web_client' // Optional: useful for cross-platform comparison
        });
        console.log(`[Analytics] Logged goal event for Group ${abGroup}`);
    } else {
        console.warn("Firebase Analytics is not initialized. Cannot log event.");
    }
};

export default {
  logPostCreation,
  logWeeklyGoalSubmission,
};