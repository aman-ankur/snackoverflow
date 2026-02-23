/**
 * Reference Nutrition Database
 *
 * Per-100g values sourced from:
 * - IFCT 2017 (Indian Food Composition Tables, NIN Hyderabad)
 * - USDA FoodData Central (fdc.nal.usda.gov)
 *
 * All values are for COOKED/PREPARED food unless noted otherwise.
 * Indian home-cooked values assume moderate oil/ghee (1-2 tsp per serving).
 */

export type FoodCategory = "indian-home" | "indian-restaurant" | "global";

export interface NutritionPer100g {
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  category: FoodCategory;
  aliases: string[];
}

export const NUTRITION_REF: Record<string, NutritionPer100g> = {
  // ─── INDIAN HOME-COOKED (Tier 1) ───

  roti: {
    cal: 240, protein: 8, carbs: 42, fat: 5, fiber: 3,
    category: "indian-home",
    aliases: ["roti", "chapati", "phulka", "fulka", "wheat roti"],
  },
  paratha_plain: {
    cal: 290, protein: 7, carbs: 38, fat: 13, fiber: 2.5,
    category: "indian-home",
    aliases: ["paratha", "plain paratha", "tawa paratha"],
  },
  aloo_paratha: {
    cal: 260, protein: 6, carbs: 35, fat: 11, fiber: 2,
    category: "indian-home",
    aliases: ["aloo paratha", "potato paratha", "stuffed paratha"],
  },
  naan: {
    cal: 290, protein: 9, carbs: 50, fat: 6, fiber: 2,
    category: "indian-home",
    aliases: ["naan", "tandoori naan", "butter naan"],
  },
  puri: {
    cal: 350, protein: 7, carbs: 40, fat: 18, fiber: 2,
    category: "indian-home",
    aliases: ["puri", "poori"],
  },
  cooked_rice: {
    cal: 130, protein: 2.5, carbs: 28, fat: 0.3, fiber: 0.4,
    category: "indian-home",
    aliases: ["rice", "chawal", "steamed rice", "white rice", "cooked rice"],
  },
  jeera_rice: {
    cal: 150, protein: 3, carbs: 28, fat: 3, fiber: 0.5,
    category: "indian-home",
    aliases: ["jeera rice", "cumin rice"],
  },
  dal_tadka: {
    cal: 95, protein: 6, carbs: 12, fat: 3, fiber: 3.5,
    category: "indian-home",
    aliases: ["dal", "dal tadka", "dal fry", "toor dal", "arhar dal", "yellow dal"],
  },
  moong_dal: {
    cal: 85, protein: 7, carbs: 11, fat: 2, fiber: 3,
    category: "indian-home",
    aliases: ["moong dal", "green gram dal", "moong"],
  },
  chana_dal: {
    cal: 110, protein: 8, carbs: 14, fat: 3, fiber: 4,
    category: "indian-home",
    aliases: ["chana dal", "bengal gram dal"],
  },
  rajma: {
    cal: 120, protein: 7, carbs: 16, fat: 3, fiber: 5,
    category: "indian-home",
    aliases: ["rajma", "kidney beans", "rajma curry", "rajma masala"],
  },
  chole: {
    cal: 140, protein: 8, carbs: 18, fat: 4, fiber: 5,
    category: "indian-home",
    aliases: ["chole", "chana", "chickpea curry", "chana masala", "chole masala"],
  },
  paneer_bhurji: {
    cal: 160, protein: 11, carbs: 4, fat: 11, fiber: 0.5,
    category: "indian-home",
    aliases: ["paneer bhurji", "scrambled paneer"],
  },
  palak_paneer: {
    cal: 150, protein: 10, carbs: 6, fat: 10, fiber: 2,
    category: "indian-home",
    aliases: ["palak paneer", "saag paneer", "spinach paneer"],
  },
  matar_paneer: {
    cal: 155, protein: 9, carbs: 8, fat: 10, fiber: 2,
    category: "indian-home",
    aliases: ["matar paneer", "paneer peas", "peas paneer"],
  },
  paneer_butter_masala: {
    cal: 180, protein: 10, carbs: 8, fat: 13, fiber: 1,
    category: "indian-home",
    aliases: ["paneer butter masala", "paneer makhani", "paneer tikka masala"],
  },
  aloo_gobi: {
    cal: 90, protein: 2.5, carbs: 10, fat: 4.5, fiber: 2.5,
    category: "indian-home",
    aliases: ["aloo gobi", "potato cauliflower", "gobi aloo"],
  },
  aloo_matar: {
    cal: 100, protein: 3, carbs: 13, fat: 4, fiber: 2.5,
    category: "indian-home",
    aliases: ["aloo matar", "potato peas", "matar aloo"],
  },
  bhindi_masala: {
    cal: 80, protein: 2, carbs: 7, fat: 5, fiber: 3,
    category: "indian-home",
    aliases: ["bhindi", "okra", "bhindi masala", "lady finger"],
  },
  baingan_bharta: {
    cal: 85, protein: 2, carbs: 8, fat: 5, fiber: 3,
    category: "indian-home",
    aliases: ["baingan bharta", "eggplant", "brinjal"],
  },
  mixed_veg: {
    cal: 80, protein: 3, carbs: 9, fat: 3.5, fiber: 3,
    category: "indian-home",
    aliases: ["mixed veg", "sabzi", "mixed vegetable", "veg curry"],
  },
  egg_curry: {
    cal: 130, protein: 10, carbs: 5, fat: 8, fiber: 1,
    category: "indian-home",
    aliases: ["egg curry", "anda curry", "egg masala"],
  },
  boiled_egg: {
    cal: 155, protein: 13, carbs: 1, fat: 11, fiber: 0,
    category: "indian-home",
    aliases: ["boiled egg", "egg", "anda"],
  },
  chicken_curry: {
    cal: 150, protein: 18, carbs: 5, fat: 7, fiber: 0.5,
    category: "indian-home",
    aliases: ["chicken curry", "chicken masala", "murgh curry"],
  },
  fish_curry: {
    cal: 120, protein: 16, carbs: 4, fat: 5, fiber: 0.5,
    category: "indian-home",
    aliases: ["fish curry", "machhi curry", "fish masala"],
  },
  raita: {
    cal: 55, protein: 3, carbs: 4, fat: 3, fiber: 0.3,
    category: "indian-home",
    aliases: ["raita", "curd raita", "boondi raita", "cucumber raita"],
  },
  curd: {
    cal: 60, protein: 3.5, carbs: 5, fat: 3, fiber: 0,
    category: "indian-home",
    aliases: ["curd", "dahi", "yogurt", "plain yogurt"],
  },
  sambar: {
    cal: 55, protein: 3, carbs: 7, fat: 2, fiber: 2,
    category: "indian-home",
    aliases: ["sambar", "sambhar"],
  },
  coconut_chutney: {
    cal: 120, protein: 2, carbs: 5, fat: 10, fiber: 2,
    category: "indian-home",
    aliases: ["coconut chutney", "nariyal chutney"],
  },
  idli: {
    cal: 140, protein: 4, carbs: 26, fat: 1, fiber: 1.5,
    category: "indian-home",
    aliases: ["idli", "idly"],
  },
  plain_dosa: {
    cal: 165, protein: 4, carbs: 25, fat: 5, fiber: 1,
    category: "indian-home",
    aliases: ["dosa", "plain dosa", "sada dosa"],
  },
  masala_dosa: {
    cal: 175, protein: 4.5, carbs: 24, fat: 7, fiber: 1.5,
    category: "indian-home",
    aliases: ["masala dosa"],
  },
  upma: {
    cal: 120, protein: 3, carbs: 18, fat: 4, fiber: 1.5,
    category: "indian-home",
    aliases: ["upma", "rava upma", "suji upma"],
  },
  poha: {
    cal: 110, protein: 3, carbs: 20, fat: 2.5, fiber: 1,
    category: "indian-home",
    aliases: ["poha", "flattened rice", "beaten rice", "chivda"],
  },
  khichdi: {
    cal: 105, protein: 4, carbs: 16, fat: 2.5, fiber: 1.5,
    category: "indian-home",
    aliases: ["khichdi", "khichri", "dal khichdi"],
  },
  halwa: {
    cal: 250, protein: 3, carbs: 35, fat: 12, fiber: 0.5,
    category: "indian-home",
    aliases: ["halwa", "suji halwa", "sheera", "gajar halwa", "carrot halwa"],
  },
  lassi: {
    cal: 75, protein: 3, carbs: 12, fat: 2, fiber: 0,
    category: "indian-home",
    aliases: ["lassi", "sweet lassi", "mango lassi", "chaas", "buttermilk"],
  },
  chai: {
    cal: 45, protein: 1.5, carbs: 6, fat: 1.5, fiber: 0,
    category: "indian-home",
    aliases: ["chai", "tea", "masala chai", "milk tea"],
  },

  // ─── INDIAN RESTAURANT / STREET FOOD (Tier 2) ───

  chicken_biryani: {
    cal: 160, protein: 10, carbs: 20, fat: 5, fiber: 0.5,
    category: "indian-restaurant",
    aliases: ["chicken biryani", "biryani", "hyderabadi biryani", "dum biryani"],
  },
  butter_chicken: {
    cal: 175, protein: 14, carbs: 6, fat: 11, fiber: 0.5,
    category: "indian-restaurant",
    aliases: ["butter chicken", "murgh makhani"],
  },
  dal_makhani: {
    cal: 130, protein: 6, carbs: 12, fat: 7, fiber: 3,
    category: "indian-restaurant",
    aliases: ["dal makhani", "maa ki dal", "black dal"],
  },
  bhature: {
    cal: 315, protein: 7, carbs: 40, fat: 14, fiber: 1.5,
    category: "indian-restaurant",
    aliases: ["bhature", "bhatura", "chole bhature"],
  },
  samosa: {
    cal: 260, protein: 5, carbs: 28, fat: 14, fiber: 2,
    category: "indian-restaurant",
    aliases: ["samosa", "aloo samosa"],
  },
  pakora: {
    cal: 240, protein: 5, carbs: 22, fat: 14, fiber: 2,
    category: "indian-restaurant",
    aliases: ["pakora", "pakoda", "bhajiya", "onion pakora"],
  },
  momos: {
    cal: 180, protein: 8, carbs: 22, fat: 6, fiber: 1,
    category: "indian-restaurant",
    aliases: ["momos", "momo", "steamed momos", "veg momos", "chicken momos"],
  },
  pav_bhaji: {
    cal: 200, protein: 5, carbs: 25, fat: 9, fiber: 3,
    category: "indian-restaurant",
    aliases: ["pav bhaji"],
  },
  vada_pav: {
    cal: 280, protein: 6, carbs: 35, fat: 13, fiber: 2,
    category: "indian-restaurant",
    aliases: ["vada pav", "wada pav"],
  },
  tandoori_chicken: {
    cal: 150, protein: 22, carbs: 3, fat: 6, fiber: 0,
    category: "indian-restaurant",
    aliases: ["tandoori chicken", "tandoori murgh"],
  },

  // ─── GLOBAL ITEMS (Tier 3) ───

  white_bread: {
    cal: 265, protein: 9, carbs: 49, fat: 3, fiber: 2.5,
    category: "global",
    aliases: ["bread", "white bread", "sandwich bread", "toast"],
  },
  butter: {
    cal: 717, protein: 0.8, carbs: 0, fat: 81, fiber: 0,
    category: "global",
    aliases: ["butter", "makhan"],
  },
  cheese: {
    cal: 350, protein: 22, carbs: 2, fat: 28, fiber: 0,
    category: "global",
    aliases: ["cheese", "cheddar", "processed cheese"],
  },
  ice_cream: {
    cal: 207, protein: 3.5, carbs: 24, fat: 11, fiber: 0,
    category: "global",
    aliases: ["ice cream", "vanilla ice cream", "chocolate ice cream"],
  },
  pizza: {
    cal: 266, protein: 11, carbs: 33, fat: 10, fiber: 2,
    category: "global",
    aliases: ["pizza", "cheese pizza", "margherita pizza"],
  },
  pasta_cooked: {
    cal: 160, protein: 6, carbs: 31, fat: 1, fiber: 2,
    category: "global",
    aliases: ["pasta", "spaghetti", "penne", "macaroni", "noodles"],
  },
  burger: {
    cal: 250, protein: 14, carbs: 24, fat: 11, fiber: 1,
    category: "global",
    aliases: ["burger", "hamburger", "cheeseburger", "veggie burger"],
  },
  french_fries: {
    cal: 312, protein: 3.5, carbs: 41, fat: 15, fiber: 3.5,
    category: "global",
    aliases: ["french fries", "fries", "chips"],
  },
  cereal_with_milk: {
    cal: 140, protein: 4, carbs: 25, fat: 3, fiber: 1.5,
    category: "global",
    aliases: ["cereal", "cornflakes", "muesli", "oats"],
  },
  banana: {
    cal: 89, protein: 1, carbs: 23, fat: 0.3, fiber: 2.6,
    category: "global",
    aliases: ["banana", "kela"],
  },
  apple: {
    cal: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4,
    category: "global",
    aliases: ["apple", "seb"],
  },
  milk: {
    cal: 60, protein: 3.2, carbs: 5, fat: 3, fiber: 0,
    category: "global",
    aliases: ["milk", "doodh", "whole milk", "full cream milk"],
  },
  peanuts: {
    cal: 567, protein: 26, carbs: 16, fat: 49, fiber: 8.5,
    category: "global",
    aliases: ["peanuts", "moongfali", "groundnut", "mungfali"],
  },
  chocolate: {
    cal: 535, protein: 7, carbs: 60, fat: 30, fiber: 3,
    category: "global",
    aliases: ["chocolate", "milk chocolate", "dark chocolate"],
  },
  sandwich: {
    cal: 230, protein: 10, carbs: 28, fat: 9, fiber: 2,
    category: "global",
    aliases: ["sandwich", "veg sandwich", "grilled sandwich"],
  },
  maggi: {
    cal: 440, protein: 9, carbs: 58, fat: 18, fiber: 3,
    category: "global",
    aliases: ["maggi", "instant noodles", "ramen", "cup noodles"],
  },

  // ─── PACKAGED SNACKS (Tier 3 continued) ───

  biscuit_sweet: {
    cal: 450, protein: 6, carbs: 70, fat: 16, fiber: 2,
    category: "global",
    aliases: ["biscuit", "biscuits", "parle-g", "parle g", "marie", "cookie", "cookies", "digestive"],
  },
  potato_chips: {
    cal: 536, protein: 7, carbs: 53, fat: 33, fiber: 4,
    category: "global",
    aliases: ["chips", "lays", "potato chips", "crisps", "kurkure", "namkeen"],
  },
  sugar: {
    cal: 387, protein: 0, carbs: 100, fat: 0, fiber: 0,
    category: "global",
    aliases: ["sugar", "cheeni", "sugar packet"],
  },
  black_coffee: {
    cal: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0,
    category: "global",
    aliases: ["black coffee", "coffee", "espresso", "americano"],
  },
  mayo: {
    cal: 680, protein: 1, carbs: 1, fat: 75, fiber: 0,
    category: "global",
    aliases: ["mayo", "mayonnaise"],
  },
  mango: {
    cal: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6,
    category: "global",
    aliases: ["mango", "aam"],
  },

  // ─── MORE RESTAURANT / INDO-CHINESE ───

  hakka_noodles: {
    cal: 150, protein: 4, carbs: 22, fat: 5, fiber: 1.5,
    category: "indian-restaurant",
    aliases: ["hakka noodles", "veg noodles", "chow mein", "chowmein"],
  },
  fried_rice: {
    cal: 170, protein: 4, carbs: 25, fat: 6, fiber: 1,
    category: "indian-restaurant",
    aliases: ["fried rice", "veg fried rice", "schezwan fried rice"],
  },
  manchurian: {
    cal: 130, protein: 3, carbs: 14, fat: 7, fiber: 1.5,
    category: "indian-restaurant",
    aliases: ["manchurian", "gobi manchurian", "veg manchurian", "manchurian gravy"],
  },
  paneer_tikka: {
    cal: 175, protein: 12, carbs: 5, fat: 12, fiber: 1,
    category: "indian-restaurant",
    aliases: ["paneer tikka", "tikka"],
  },
  shawarma: {
    cal: 160, protein: 12, carbs: 15, fat: 6, fiber: 1,
    category: "global",
    aliases: ["shawarma", "chicken shawarma", "shawarma roll"],
  },
  garlic_bread: {
    cal: 350, protein: 8, carbs: 42, fat: 16, fiber: 2,
    category: "global",
    aliases: ["garlic bread"],
  },

  // ─── MORE SOUTH INDIAN / REGIONAL ───

  pongal: {
    cal: 130, protein: 4, carbs: 18, fat: 4.5, fiber: 1,
    category: "indian-home",
    aliases: ["pongal", "ven pongal", "khara pongal"],
  },
  lemon_rice: {
    cal: 140, protein: 3, carbs: 26, fat: 3, fiber: 0.5,
    category: "indian-home",
    aliases: ["lemon rice", "chitranna", "nimmakaya pulihora"],
  },
  papad: {
    cal: 340, protein: 18, carbs: 46, fat: 7, fiber: 5,
    category: "indian-home",
    aliases: ["papad", "papadum", "appalam"],
  },

  // ─── INDIAN SWEETS ───

  gulab_jamun: {
    cal: 300, protein: 4, carbs: 45, fat: 12, fiber: 0.5,
    category: "indian-restaurant",
    aliases: ["gulab jamun", "gulabjamun"],
  },
  jalebi: {
    cal: 370, protein: 3, carbs: 60, fat: 13, fiber: 0.5,
    category: "indian-restaurant",
    aliases: ["jalebi"],
  },
  rasgulla: {
    cal: 186, protein: 5, carbs: 35, fat: 3, fiber: 0,
    category: "indian-restaurant",
    aliases: ["rasgulla", "rosogolla"],
  },
  barfi: {
    cal: 350, protein: 7, carbs: 50, fat: 14, fiber: 0.5,
    category: "indian-restaurant",
    aliases: ["barfi", "burfi", "kaju barfi", "kaju katli"],
  },
};

/**
 * ~35 items injected into the prompt as a compact reference table.
 * Categorized with [INDIAN], [RESTAURANT], [GLOBAL] labels.
 */
const PROMPT_ITEMS: string[] = [
  // Indian home (~22)
  "roti", "paratha_plain", "naan", "puri", "cooked_rice",
  "dal_tadka", "moong_dal", "rajma", "chole",
  "paneer_bhurji", "palak_paneer", "aloo_gobi", "mixed_veg",
  "chicken_curry", "egg_curry", "boiled_egg",
  "sambar", "coconut_chutney", "idli", "plain_dosa", "masala_dosa", "poha",
  // Restaurant (~7)
  "chicken_biryani", "bhature", "butter_chicken", "samosa", "momos",
  "hakka_noodles", "gulab_jamun",
  // Global (~10)
  "white_bread", "butter", "ice_cream", "pizza", "banana",
  "peanuts", "milk", "maggi", "shawarma", "black_coffee",
];

const CATEGORY_LABEL: Record<FoodCategory, string> = {
  "indian-home": "INDIAN",
  "indian-restaurant": "RESTAURANT",
  "global": "GLOBAL",
};

const PACKAGED_ANCHORS = `
PER-PIECE WEIGHTS: 1 biscuit(Parle-G)=9g, 1 Maggi packet=70g dry=310kcal total, 1 small chips packet=30g, 1 sugar sachet=4g=15kcal, 1 pizza slice=110g=280kcal, 1 gulab jamun=50g, 1 shawarma roll=250g, 1 paneer tikka piece=30g`.trim();

export function buildReferenceTable(): string {
  if (process.env.DISABLE_NUTRITION_REF === "true") return "";
  const lines: string[] = [];
  for (const key of PROMPT_ITEMS) {
    const item = NUTRITION_REF[key];
    if (!item) continue;
    const label = CATEGORY_LABEL[item.category];
    const name = item.aliases[0];
    lines.push(
      `[${label}] ${name}: ${item.cal} cal, ${item.protein}g P, ${item.carbs}g C, ${item.fat}g F, ${item.fiber}g fiber`
    );
  }
  return lines.join("\n") + "\n\n" + PACKAGED_ANCHORS;
}

export function findMatchingRef(dishName: string): NutritionPer100g | null {
  const lower = dishName.toLowerCase().trim();

  for (const [, item] of Object.entries(NUTRITION_REF)) {
    for (const alias of item.aliases) {
      if (lower.includes(alias) || alias.includes(lower)) {
        return item;
      }
    }
  }

  return null;
}
