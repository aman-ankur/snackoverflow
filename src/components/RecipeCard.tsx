"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, ChefHat, ChevronDown, ChevronUp, Flame } from "lucide-react";
import type { Recipe } from "@/lib/recipes";

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
}

export default function RecipeCard({ recipe, index }: RecipeCardProps) {
  const [expanded, setExpanded] = useState(false);

  const difficultyColor = {
    Easy: "text-green-400 bg-green-400/10 border-green-400/20",
    Medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    Hard: "text-red-400 bg-red-400/10 border-red-400/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="rounded-2xl bg-surface border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-foreground truncate">
                {recipe.name}
              </h3>
              <span className="text-sm text-foreground/30 font-medium shrink-0">
                {recipe.hindi}
              </span>
            </div>
            <p className="text-xs text-foreground/50 leading-relaxed line-clamp-2">
              {recipe.description}
            </p>
          </div>
        </div>

        {/* Meta badges */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-full bg-orange/10 border border-orange/20 px-2.5 py-1 text-xs font-medium text-orange">
            <Clock className="h-3 w-3" />
            {recipe.time}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${difficultyColor[recipe.difficulty]}`}
          >
            <Flame className="h-3 w-3" />
            {recipe.difficulty}
          </span>
          {recipe.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-foreground/5 border border-foreground/10 px-2.5 py-1 text-xs text-foreground/40"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-center gap-1.5 border-t border-border py-2.5 text-xs font-medium text-foreground/40 hover:text-accent hover:bg-surface-hover transition-all"
      >
        <ChefHat className="h-3.5 w-3.5" />
        {expanded ? "Hide Steps" : "View Steps"}
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Steps */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="border-t border-border"
        >
          <div className="p-4 space-y-2.5">
            <h4 className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">
              Steps
            </h4>
            {recipe.steps.map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  {step}
                </p>
              </div>
            ))}
          </div>

          {/* Ingredients needed */}
          <div className="px-4 pb-4">
            <h4 className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-2">
              Key Ingredients
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {recipe.ingredients.map((ing) => (
                <span
                  key={ing}
                  className="rounded-full bg-orange/10 border border-orange/20 px-2.5 py-1 text-xs text-orange capitalize"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
