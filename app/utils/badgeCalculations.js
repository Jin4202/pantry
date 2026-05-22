// Helper to determine the start of the week for a given date
export const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 for Sunday, 1 for Monday, etc.
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Determine if a user needs to set their weekly goal.
export const requiresGoalSetting = (userData) => {
    // 1. Get the current date and the date the user last started their "week"
    const today = new Date();
    const lastStart = userData.streakStartDate ? new Date(userData.streakStartDate.toDate()) : null;

    // Goal has never been set (First-time user)
    if (!userData.weeklyGoal || !lastStart) {
      return true;
    }

    // 2. Determine if a new week has started since the last streakStartDate
    // Compare the start of the current calendar week to the start of the recorded week.
    const currentWeekStart = getStartOfWeek(today).getTime();
    const lastWeekStart = getStartOfWeek(lastStart).getTime();
    
    // If the current calendar week is after the recorded week, they need to set a goal.
    return currentWeekStart > lastWeekStart;
};

export function evaluateUserBadges(userData, currentBadges = {}) {
  // Condition values
  const photoCount = userData.photoCount || 0;
  const streakCount = userData.streakCount || 0;
  const journalCount = userData.journalCount || 0;
  const thanksgivingChallenge = (userData.thanksgivingChallengeTasks.length >= 5) || false;

  const nextBadges = { ...currentBadges };
  const newlyUnlocked = [];

  // --- Meal Badges ---
  if (photoCount >= 1 && !nextBadges.cook_first) {
    nextBadges.cook_first = true;
    newlyUnlocked.push('cook_first');
  }
  if (photoCount >= 10 && !nextBadges.meal_10) {
    nextBadges.meal_10 = true;
    newlyUnlocked.push('meal_10');
  }
  if (photoCount >= 20 && !nextBadges.meal_20) {
    nextBadges.meal_20 = true;
    newlyUnlocked.push('meal_20');
  }

  // --- Streak Badges ---
  if (streakCount >= 3 && !nextBadges.streak_3) {
    nextBadges.streak_3 = true;
    newlyUnlocked.push('streak_3');
  }
  if (streakCount >= 7 && !nextBadges.streak_7) {
    nextBadges.streak_7 = true;
    newlyUnlocked.push('streak_7');
  }
  if (streakCount >= 30 && !nextBadges.streak_30) {
    nextBadges.streak_30 = true;
    newlyUnlocked.push('streak_30');
  }

  // --- Journal Badges ---
  if (journalCount >= 5 && !nextBadges.journal_5) {
    nextBadges.journal_5 = true;
    newlyUnlocked.push('journal_5');
  }
  if (journalCount >= 10 && !nextBadges.journal_10) {
    nextBadges.journal_10 = true;
    newlyUnlocked.push('journal_10');
  }
  if (journalCount >= 20 && !nextBadges.journal_20) {
    nextBadges.journal_20 = true;
    newlyUnlocked.push('journal_20');
  }
  if (thanksgivingChallenge && !nextBadges.thanksgiving_challenge) {
    nextBadges.thanksgiving_challenge = true;
    newlyUnlocked.push('thanksgiving_challenge');
  }

  return { updatedBadges: nextBadges, newlyUnlocked };
}

export default {
  getStartOfWeek,
  requiresGoalSetting,
  evaluateUserBadges,
};