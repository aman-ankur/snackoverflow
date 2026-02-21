"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, UtensilsCrossed } from "lucide-react";
import { getMatchingRecipes } from "@/lib/recipes";
import RecipeCard from "./RecipeCard";

interface RecipeSuggestionsProps {
  detectedItems: Map<string, number>;
}

export default function RecipeSuggestions({
  detectedItems,
}: RecipeSuggestionsProps) {
  const ingredients = useMemo(
    () => Array.from(detectedItems.keys()),
    [detectedItems]
  );

  const recipes = useMemo(
    () => getMatchingRecipes(ingredients),
    [ingredients]
  );

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-4 w-4 text-orange" />
        <h2 className="text-sm font-semibold">Recipe Suggestions</h2>
        {recipes.length > 0 && (
          <span className="rounded-full bg-orange/20 px-2 py-0.5 text-xs font-medium text-orange">
            {recipes.length}
          </span>
        )}
      </div>

      {/* Recipe list */}
      <AnimatePresence mode="popLayout">
        {recipes.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-card border border-border py-10 px-6"
          >
            <div className="rounded-full bg-orange-glow p-4">
              <UtensilsCrossed className="h-8 w-8 text-orange/60" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted">
                No recipes yet
              </p>
              <p className="text-xs text-muted mt-1">
                Scan items in your fridge to get Indian recipe suggestions
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {recipes.map((recipe, i) => (
              <RecipeCard key={recipe.name} recipe={recipe} index={i} />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
