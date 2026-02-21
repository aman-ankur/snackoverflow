import type { CapyMood, MealTotals, NutritionGoals, StreakData } from "@/lib/dishTypes";

interface CapyState {
  mood: CapyMood;
  line: string;
}

function getTimeOfDay(): "morning" | "afternoon" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function getGreeting(): string {
  const time = getTimeOfDay();
  if (time === "morning") return "Good morning!";
  if (time === "afternoon") return "Good afternoon!";
  return "Good evening!";
}

const MORNING_NO_MEALS = [
  "Rise and shine! What's for breakfast? 🌅",
  "Morning! Let's start the day right 🥣",
  "I'm still sleepy… wake me up with breakfast! 😴",
  "A good breakfast sets the tone! Ready? 🌞",
];

const ON_TRACK = [
  "Looking good! Keep it up 💪",
  "You're crushing it today! 🎯",
  "Steady progress — love to see it 🙌",
  "Right on track! Your body thanks you 💚",
];

const ALMOST_THERE = [
  "So close to your goal! Just a bit more 🏁",
  "Almost there! One more meal should do it 🍛",
  "You're nearly at 100%! Finish strong 💪",
];

const GOAL_HIT = [
  "You did it! Daily goal complete! 🎉",
  "100%! I'm so proud of you! 🤩",
  "Goals crushed! Time to relax 🥳",
  "Perfect day! You're unstoppable! ⭐",
];

const OVER_GOAL = [
  "Big appetite today! Maybe go easy now 😅",
  "Whoa, over target! A walk might help 🚶",
  "That's a lot! Tomorrow's a fresh start 💚",
];

const PROTEIN_CRUSHED = [
  "Protein goals crushed! Your muscles thank you 💪",
  "Look at that protein! Gains incoming 🏋️",
];

const EVENING_UNDER = [
  "Don't forget dinner! You've got calories left 🍛",
  "Evening! Still room for a healthy meal 🌙",
  "Wrap up the day with something nutritious 🥗",
];

const STREAK_LINES: Record<number, string> = {
  3: "3 days straight! Building a habit! 🔥",
  7: "One whole week! You're unstoppable! 🔥🔥",
  14: "2 weeks! Capy is impressed! 🏆",
  30: "30 days! You're a legend! 👑",
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getCapyState(
  totals: MealTotals,
  goals: NutritionGoals,
  streak: StreakData,
  mealsCount: number
): CapyState {
  const calPercent = goals.calories > 0 ? totals.calories / goals.calories : 0;
  const proteinPercent = goals.protein > 0 ? totals.protein / goals.protein : 0;
  const time = getTimeOfDay();

  // Streak milestone check
  const streakLine = STREAK_LINES[streak.currentStreak];
  if (streakLine) {
    return { mood: "excited", line: streakLine };
  }

  // No meals logged
  if (mealsCount === 0) {
    if (time === "morning") {
      return { mood: "sleepy", line: pick(MORNING_NO_MEALS) };
    }
    return { mood: "sleepy", line: "No meals yet today. Let's scan something! 📸" };
  }

  // Over goal
  if (calPercent > 1.3) {
    return { mood: "concerned", line: pick(OVER_GOAL) };
  }

  // Hit goal
  if (calPercent >= 0.95) {
    return { mood: "excited", line: pick(GOAL_HIT) };
  }

  // Protein crushed
  if (proteinPercent >= 1.0 && calPercent < 0.95) {
    return { mood: "happy", line: pick(PROTEIN_CRUSHED) };
  }

  // Almost there
  if (calPercent >= 0.75) {
    return { mood: "happy", line: pick(ALMOST_THERE) };
  }

  // Evening, under goal
  if (time === "evening" && calPercent < 0.6) {
    return { mood: "happy", line: pick(EVENING_UNDER) };
  }

  // On track
  return { mood: "happy", line: pick(ON_TRACK) };
}

export { getGreeting };
