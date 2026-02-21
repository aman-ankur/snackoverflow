import type { CapyMood } from "@/lib/dishTypes";
import type { GardenState } from "@/lib/useGardenState";

export interface MotivationLine {
  text: string;
  mood: CapyMood;
  context: string;
}

const SEEN_KEY = "fridgenius-capy-motivation-seen";

// ── Pre-built motivation lines (60+) ──────────────────────────────────

const STREAK_LINES: MotivationLine[] = [
  { text: "3 days in a row! We're building a habit together! 🔥", mood: "excited", context: "streak-3" },
  { text: "5 days strong! I can feel the momentum! 💪", mood: "excited", context: "streak-5" },
  { text: "One whole week! You're unstoppable! 🔥🔥", mood: "excited", context: "streak-7" },
  { text: "10 days! I'm so proud of us! ⭐", mood: "excited", context: "streak-10" },
  { text: "2 weeks! Look at this beautiful garden we've built! 🏆", mood: "excited", context: "streak-14" },
  { text: "21 days! They say it takes 21 days to form a habit. We did it! 🎉", mood: "excited", context: "streak-21" },
  { text: "30 days! A whole month! I'm wearing my golden crown! 👑", mood: "excited", context: "streak-30" },
];

const GOAL_HIT_LINES: MotivationLine[] = [
  { text: "You hit your calorie goal today! The garden is thriving! 🎯", mood: "excited", context: "goal-hit" },
  { text: "Daily goal complete! A new flower just bloomed! 🌸", mood: "happy", context: "goal-hit" },
  { text: "Perfect day! Your dedication is making the garden beautiful! 🌺", mood: "excited", context: "goal-hit" },
  { text: "Goals crushed! I planted a flower to celebrate! 🌻", mood: "happy", context: "goal-hit" },
  { text: "100%! Every meal counted today. I'm so happy! 🤩", mood: "excited", context: "goal-hit" },
];

const PROTEIN_LINES: MotivationLine[] = [
  { text: "Protein champion! Your muscles and my tree thank you! 💪🌳", mood: "happy", context: "protein" },
  { text: "Great protein intake! Watch the tree grow! 🌲", mood: "happy", context: "protein" },
  { text: "Protein goals smashed! Gains incoming! 🏋️", mood: "excited", context: "protein" },
];

const MORNING_LINES: MotivationLine[] = [
  { text: "Good morning! Let's make today count! ☀️", mood: "happy", context: "morning" },
  { text: "Rise and shine! The garden is waiting for you! 🌅", mood: "sleepy", context: "morning" },
  { text: "A new day, a new chance to grow our garden! 🌱", mood: "happy", context: "morning" },
  { text: "Morning! I watered the flowers while you slept! 💧", mood: "happy", context: "morning" },
  { text: "Let's start with a healthy breakfast! The garden needs you! 🥣", mood: "motivated", context: "morning" },
];

const AFTERNOON_LINES: MotivationLine[] = [
  { text: "Afternoon check-in! How's your day going? 🌤️", mood: "happy", context: "afternoon" },
  { text: "Don't forget lunch! The garden grows with every meal! 🍛", mood: "happy", context: "afternoon" },
  { text: "Halfway through the day! Keep the momentum going! 💚", mood: "motivated", context: "afternoon" },
  { text: "The sun is shining on our garden! Just like your progress! ☀️", mood: "happy", context: "afternoon" },
];

const EVENING_LINES: MotivationLine[] = [
  { text: "Evening! Time to wrap up the day with a good meal! 🌙", mood: "happy", context: "evening" },
  { text: "The stars are coming out! How was your nutrition today? ✨", mood: "happy", context: "evening" },
  { text: "Almost bedtime! Let's review how we did today! 🌜", mood: "sleepy", context: "evening" },
  { text: "Great day! The garden is settling in for the night! 🌿", mood: "happy", context: "evening" },
];

const COMEBACK_LINES: MotivationLine[] = [
  { text: "I missed you! The garden needs your care! 🥺", mood: "concerned", context: "comeback" },
  { text: "Welcome back! Let's get the garden growing again! 🌱", mood: "happy", context: "comeback" },
  { text: "You're here! Some flowers wilted but we can fix this! 💚", mood: "concerned", context: "comeback" },
  { text: "Every journey has pauses. What matters is you came back! 🤗", mood: "happy", context: "comeback" },
  { text: "The garden was waiting for you! Let's bring it back to life! 🌻", mood: "motivated", context: "comeback" },
];

const GARDEN_LINES: MotivationLine[] = [
  { text: "Look at all these flowers! Your consistency is beautiful! 🌸", mood: "happy", context: "garden" },
  { text: "The tree is growing so tall! Keep hitting those protein goals! 🌳", mood: "happy", context: "garden" },
  { text: "Butterflies love our garden! They came because of your streak! 🦋", mood: "excited", context: "garden" },
  { text: "The pond is so peaceful! Fish are swimming happily! 🐟", mood: "happy", context: "garden" },
  { text: "A rainbow! Only the most dedicated gardeners see this! 🌈", mood: "excited", context: "garden" },
  { text: "Our garden is the most beautiful one I've ever seen! 🏡", mood: "happy", context: "garden" },
  { text: "Every flower represents a day you showed up. I'm proud! 🌺", mood: "happy", context: "garden" },
];

const EMOTIONAL_LINES: MotivationLine[] = [
  { text: "I was waiting for you! Let's do something great today! 💚", mood: "happy", context: "emotional" },
  { text: "You make me so happy when you log meals! 🥰", mood: "excited", context: "emotional" },
  { text: "Together we're building something beautiful! 🌿", mood: "happy", context: "emotional" },
  { text: "Your health journey inspires me! Keep going! ✨", mood: "motivated", context: "emotional" },
  { text: "I believe in you! One meal at a time! 💪", mood: "motivated", context: "emotional" },
  { text: "You're not just tracking food — you're growing a garden of health! 🌱", mood: "happy", context: "emotional" },
  { text: "Every scan, every log — it all adds up! I see your effort! 👀", mood: "happy", context: "emotional" },
  { text: "The best time to plant a tree was yesterday. The second best is now! 🌳", mood: "motivated", context: "emotional" },
];

const SAD_LINES: MotivationLine[] = [
  { text: "My flowers are drooping... can we log a meal? 🥀", mood: "concerned", context: "sad" },
  { text: "The garden misses you... it's getting a bit dry 😢", mood: "concerned", context: "sad" },
  { text: "I'm a little lonely here... come take care of the garden? 🥺", mood: "sleepy", context: "sad" },
  { text: "Some leaves are falling... but it's not too late! 🍂", mood: "concerned", context: "sad" },
];

const ALL_LINES: MotivationLine[] = [
  ...STREAK_LINES,
  ...GOAL_HIT_LINES,
  ...PROTEIN_LINES,
  ...MORNING_LINES,
  ...AFTERNOON_LINES,
  ...EVENING_LINES,
  ...COMEBACK_LINES,
  ...GARDEN_LINES,
  ...EMOTIONAL_LINES,
  ...SAD_LINES,
];

// ── Selection logic ───────────────────────────────────────────────────

function getTimeOfDay(): "morning" | "afternoon" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function getSeenSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function markSeen(text: string) {
  if (typeof window === "undefined") return;
  const seen = getSeenSet();
  seen.add(text);
  // Keep only last 40 to allow cycling
  const arr = Array.from(seen);
  if (arr.length > 40) arr.splice(0, arr.length - 40);
  localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
}

function pickUnseen(lines: MotivationLine[]): MotivationLine | null {
  const seen = getSeenSet();
  const unseen = lines.filter((l) => !seen.has(l.text));
  if (unseen.length > 0) {
    return unseen[Math.floor(Math.random() * unseen.length)];
  }
  // All seen — pick random anyway
  if (lines.length > 0) {
    return lines[Math.floor(Math.random() * lines.length)];
  }
  return null;
}

export function getContextualMotivation(
  garden: GardenState,
  streak: number,
  todayCalories: number,
  calorieGoal: number,
  todayProtein: number,
  proteinGoal: number
): MotivationLine {
  const time = getTimeOfDay();
  const calPercent = calorieGoal > 0 ? todayCalories / calorieGoal : 0;
  const protPercent = proteinGoal > 0 ? todayProtein / proteinGoal : 0;

  // Priority-based selection
  let candidates: MotivationLine[] = [];

  // Streak milestones first
  if ([3, 5, 7, 10, 14, 21, 30].includes(streak)) {
    candidates = STREAK_LINES.filter((l) => l.context === `streak-${streak}`);
    const pick = pickUnseen(candidates);
    if (pick) { markSeen(pick.text); return pick; }
  }

  // Goal hit
  if (calPercent >= 0.8 && calPercent <= 1.2) {
    candidates = GOAL_HIT_LINES;
    const pick = pickUnseen(candidates);
    if (pick) { markSeen(pick.text); return pick; }
  }

  // Protein champion
  if (protPercent >= 0.9) {
    candidates = PROTEIN_LINES;
    const pick = pickUnseen(candidates);
    if (pick) { markSeen(pick.text); return pick; }
  }

  // Wilting garden
  if (garden.gardenHealth < 30) {
    candidates = SAD_LINES;
    const pick = pickUnseen(candidates);
    if (pick) { markSeen(pick.text); return pick; }
  }

  // Comeback
  if (streak === 0 && garden.totalMealsLogged > 0) {
    candidates = COMEBACK_LINES;
    const pick = pickUnseen(candidates);
    if (pick) { markSeen(pick.text); return pick; }
  }

  // Garden-specific (if garden has notable elements)
  if (garden.flowers >= 5 || garden.treeLevel >= 2 || garden.pondLevel >= 1) {
    candidates = GARDEN_LINES;
    const pick = pickUnseen(candidates);
    if (pick) { markSeen(pick.text); return pick; }
  }

  // Time-of-day
  const timeLines = time === "morning" ? MORNING_LINES : time === "afternoon" ? AFTERNOON_LINES : EVENING_LINES;
  candidates = [...timeLines, ...EMOTIONAL_LINES];
  const pick = pickUnseen(candidates);
  if (pick) { markSeen(pick.text); return pick; }

  // Ultimate fallback
  const fallback = pickUnseen(ALL_LINES);
  if (fallback) { markSeen(fallback.text); return fallback; }

  return { text: "Let's grow our garden together! 🌱", mood: "happy", context: "fallback" };
}

export function allLinesExhausted(): boolean {
  const seen = getSeenSet();
  return seen.size >= ALL_LINES.length;
}
