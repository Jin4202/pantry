import MealBadge1 from "../../assets/badges/meal_badge_1.png";
import MealBadge2 from "../../assets/badges/meal_badge_2.png";
import MealBadge3 from "../../assets/badges/meal_badge_3.png";
import JournalBadge1 from "../../assets/badges/journal_badge_1.png";
import JournalBadge2 from "../../assets/badges/journal_badge_2.png";
import JournalBadge3 from "../../assets/badges/journal_badge_3.png";
import StreakBadge1 from "../../assets/badges/streak_badge_1.png";
import StreakBadge2 from "../../assets/badges/streak_badge_2.png";
import StreakBadge3 from "../../assets/badges/streak_badge_3.png";
import ThanksgivingBadge from "../../assets/badges/thanksgiving_badge.png";

export const BADGE_DEFS = [
  {
    id: 'cook_first',
    name: 'First Meal',
    description: 'Upload your first meal.',
    Icon: MealBadge1,
    sortOrder: 1,
  },
  {
    id: 'meal_10',
    name: 'Ten Meals',
    description: 'Upload total ten meals.',
    Icon: MealBadge2,
    sortOrder: 2,
  },
  {
    id: 'meal_20',
    name: 'Twenty Meals',
    description: 'Upload total twenty meals.',
    Icon: MealBadge3,
    sortOrder: 3,
  },
  {
    id: 'journal_5',
    name: 'Five Journals',
    description: 'Logged five cooking journals.',
    Icon: JournalBadge1,
    sortOrder: 1,
  },
  {
    id: 'journal_10',
    name: 'Ten Journals',
    description: 'Logged ten cooking journals.',
    Icon: JournalBadge2,
    sortOrder: 2,
  },
  {
    id: 'journal_20',
    name: 'Twenty Journals',
    description: 'Logged Twenty cooking journals.',
    Icon: JournalBadge3,
    sortOrder: 3,
  },
  {
    id: 'streak_3',
    name: '3-Day Streak',
    description: 'Cook 3 days in a row.',
    Icon: StreakBadge1,
    sortOrder: 1,
  }, 
  {
    id: 'streak_7',
    name: 'One Week Streak',
    description: 'Cook 7 days in a row.',
    Icon: StreakBadge2,
    sortOrder: 2,
  }, 
  {
    id: 'streak_60',
    name: 'One Month Streak',
    description: 'Cook 30 days in a row.',
    Icon: StreakBadge3,
    sortOrder: 3,
  }, 
  {
    id: 'thanksgiving_challenge',
    name: 'Thanksgiving Challenge',
    description: 'Complete the Thanksgiving cooking challenge.',
    Icon: ThanksgivingBadge,
    sortOrder: 4,
  }, 
];

export default BADGE_DEFS;
