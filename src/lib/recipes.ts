export interface Recipe {
  name: string;
  hindi: string;
  ingredients: string[];
  time: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  steps: string[];
  tags: string[];
}

// Map COCO-SSD labels to common Indian kitchen ingredients
export const LABEL_TO_INGREDIENT: Record<string, string> = {
  apple: "Apple",
  orange: "Orange",
  banana: "Banana",
  broccoli: "Broccoli",
  carrot: "Carrot",
  sandwich: "Bread",
  pizza: "Pizza Base",
  cake: "Cake",
  donut: "Donut",
  "hot dog": "Sausage",
  bottle: "Milk/Water",
  cup: "Chai/Coffee",
  bowl: "Dal/Curry",
  knife: "Knife",
  spoon: "Spoon",
  fork: "Fork",
  wine_glass: "Lassi Glass",
  egg: "Egg",
  potato: "Potato",
  tomato: "Tomato",
  onion: "Onion",
  pepper: "Pepper",
  lemon: "Lemon",
  // COCO-SSD food categories
  food: "Mixed Vegetables",
};

// Extended ingredient mapping for demo — maps detected items to possible ingredients
export const DETECTED_TO_POSSIBLE_INGREDIENTS: Record<string, string[]> = {
  Apple: ["apple"],
  Orange: ["orange"],
  Banana: ["banana"],
  Broccoli: ["broccoli", "vegetables"],
  Carrot: ["carrot", "vegetables"],
  Bread: ["bread", "wheat"],
  "Milk/Water": ["milk", "water", "paneer", "curd"],
  "Chai/Coffee": ["tea", "coffee", "milk"],
  "Dal/Curry": ["dal", "curry", "rice"],
  "Mixed Vegetables": ["vegetables", "potato", "onion", "tomato"],
  Potato: ["potato"],
  Tomato: ["tomato"],
  Onion: ["onion"],
  Pepper: ["pepper", "chili"],
  Lemon: ["lemon"],
  Egg: ["egg"],
};

export const RECIPES: Recipe[] = [
  {
    name: "Aloo Gobi",
    hindi: "आलू गोभी",
    ingredients: ["potato", "vegetables", "onion", "tomato"],
    time: "30 min",
    difficulty: "Easy",
    description: "Classic dry curry with potatoes and cauliflower, tempered with cumin and turmeric.",
    steps: [
      "Heat oil, add cumin seeds",
      "Add chopped onions, sauté until golden",
      "Add turmeric, chili powder, and salt",
      "Add potato and cauliflower pieces",
      "Cover and cook on low heat for 20 min",
      "Garnish with coriander leaves",
    ],
    tags: ["vegetarian", "north-indian", "dry-curry"],
  },
  {
    name: "Paneer Butter Masala",
    hindi: "पनीर बटर मसाला",
    ingredients: ["paneer", "tomato", "milk", "onion"],
    time: "40 min",
    difficulty: "Medium",
    description: "Rich and creamy tomato-based curry with soft paneer cubes.",
    steps: [
      "Blend tomatoes, onions, and cashews into paste",
      "Heat butter, add paste and cook 10 min",
      "Add cream, kasuri methi, garam masala",
      "Add paneer cubes, simmer 5 min",
      "Serve hot with naan or rice",
    ],
    tags: ["vegetarian", "north-indian", "rich"],
  },
  {
    name: "Egg Bhurji",
    hindi: "अंडा भुर्जी",
    ingredients: ["egg", "onion", "tomato", "chili"],
    time: "15 min",
    difficulty: "Easy",
    description: "Spicy Indian scrambled eggs with onions, tomatoes, and green chilies.",
    steps: [
      "Heat oil, add chopped onions",
      "Add green chilies and tomatoes",
      "Beat eggs and pour into the pan",
      "Scramble on medium heat",
      "Add salt, turmeric, red chili powder",
      "Garnish with coriander",
    ],
    tags: ["egg", "quick", "breakfast"],
  },
  {
    name: "Dal Tadka",
    hindi: "दाल तड़का",
    ingredients: ["dal", "onion", "tomato", "vegetables"],
    time: "35 min",
    difficulty: "Easy",
    description: "Comforting yellow lentils with a smoky tempering of garlic and cumin.",
    steps: [
      "Pressure cook toor dal with turmeric",
      "Heat ghee, add cumin, mustard seeds",
      "Add garlic, onions, tomatoes",
      "Add cooked dal, simmer 10 min",
      "Finish with fresh coriander",
    ],
    tags: ["vegetarian", "comfort-food", "protein"],
  },
  {
    name: "Banana Shake",
    hindi: "बनाना शेक",
    ingredients: ["banana", "milk"],
    time: "5 min",
    difficulty: "Easy",
    description: "Creamy and sweet banana milkshake — perfect for a quick energy boost.",
    steps: [
      "Peel and chop 2 bananas",
      "Add cold milk and sugar to taste",
      "Blend until smooth",
      "Serve chilled with ice",
    ],
    tags: ["drink", "quick", "sweet"],
  },
  {
    name: "Mixed Veg Sabzi",
    hindi: "मिक्स वेज सब्ज़ी",
    ingredients: ["vegetables", "potato", "carrot", "onion"],
    time: "25 min",
    difficulty: "Easy",
    description: "Everyday mixed vegetable curry with a simple masala base.",
    steps: [
      "Chop all vegetables into small pieces",
      "Heat oil, add cumin and onions",
      "Add tomato puree and spices",
      "Add vegetables, cover and cook 15 min",
      "Serve with roti or rice",
    ],
    tags: ["vegetarian", "everyday", "healthy"],
  },
  {
    name: "Masala Omelette",
    hindi: "मसाला ऑमलेट",
    ingredients: ["egg", "onion", "chili", "tomato"],
    time: "10 min",
    difficulty: "Easy",
    description: "Spiced Indian-style omelette loaded with onions and green chilies.",
    steps: [
      "Beat eggs with salt and pepper",
      "Mix in chopped onions, chilies, coriander",
      "Heat oil in a pan",
      "Pour egg mixture, cook until set",
      "Fold and serve hot with bread",
    ],
    tags: ["egg", "breakfast", "quick"],
  },
  {
    name: "Fruit Chaat",
    hindi: "फ्रूट चाट",
    ingredients: ["apple", "banana", "orange", "lemon"],
    time: "10 min",
    difficulty: "Easy",
    description: "Tangy and spicy Indian fruit salad with chaat masala and lime.",
    steps: [
      "Chop all fruits into bite-sized pieces",
      "Add chaat masala, black salt, red chili",
      "Squeeze fresh lemon juice",
      "Toss well and serve immediately",
    ],
    tags: ["healthy", "snack", "quick"],
  },
  {
    name: "Bread Pakora",
    hindi: "ब्रेड पकोड़ा",
    ingredients: ["bread", "potato", "onion"],
    time: "20 min",
    difficulty: "Medium",
    description: "Crispy gram flour-coated bread stuffed with spiced potato filling.",
    steps: [
      "Make spiced mashed potato filling",
      "Spread filling between bread slices",
      "Make besan batter with spices",
      "Dip stuffed bread in batter",
      "Deep fry until golden and crispy",
      "Serve with green chutney",
    ],
    tags: ["snack", "tea-time", "fried"],
  },
  {
    name: "Jeera Rice",
    hindi: "जीरा राइस",
    ingredients: ["rice", "curry"],
    time: "20 min",
    difficulty: "Easy",
    description: "Fragrant basmati rice tempered with cumin seeds and ghee.",
    steps: [
      "Wash and soak rice for 20 min",
      "Heat ghee, add cumin seeds",
      "Add rice and sauté 2 min",
      "Add water (1:2 ratio), salt",
      "Cook until water is absorbed",
      "Fluff with fork and serve",
    ],
    tags: ["rice", "side-dish", "basic"],
  },
  {
    name: "Nimbu Pani",
    hindi: "नींबू पानी",
    ingredients: ["lemon", "water"],
    time: "5 min",
    difficulty: "Easy",
    description: "Refreshing Indian lemonade with roasted cumin and black salt.",
    steps: [
      "Squeeze 2 lemons into a glass",
      "Add sugar, black salt, roasted cumin",
      "Add cold water and ice",
      "Stir well and serve",
    ],
    tags: ["drink", "summer", "refreshing"],
  },
  {
    name: "Aloo Paratha",
    hindi: "आलू पराठा",
    ingredients: ["potato", "wheat", "bread"],
    time: "30 min",
    difficulty: "Medium",
    description: "Stuffed flatbread with spiced potato filling — a North Indian breakfast staple.",
    steps: [
      "Boil and mash potatoes",
      "Mix with green chili, coriander, spices",
      "Knead wheat dough",
      "Stuff dough balls with potato filling",
      "Roll and cook on tawa with ghee",
      "Serve with curd and pickle",
    ],
    tags: ["breakfast", "north-indian", "filling"],
  },
];

export function getMatchingRecipes(detectedIngredients: string[]): Recipe[] {
  if (detectedIngredients.length === 0) return [];

  // Expand detected items to possible ingredients
  const possibleIngredients = new Set<string>();
  detectedIngredients.forEach((item) => {
    const mapped = DETECTED_TO_POSSIBLE_INGREDIENTS[item];
    if (mapped) {
      mapped.forEach((ing) => possibleIngredients.add(ing));
    }
  });

  // Score each recipe by how many ingredients match
  const scored = RECIPES.map((recipe) => {
    const matchCount = recipe.ingredients.filter((ing) =>
      possibleIngredients.has(ing)
    ).length;
    const matchRatio = matchCount / recipe.ingredients.length;
    return { recipe, matchCount, matchRatio };
  });

  // Filter recipes with at least 1 match, sort by match ratio then count
  return scored
    .filter((s) => s.matchCount >= 1)
    .sort((a, b) => {
      if (b.matchRatio !== a.matchRatio) return b.matchRatio - a.matchRatio;
      return b.matchCount - a.matchCount;
    })
    .map((s) => s.recipe);
}
