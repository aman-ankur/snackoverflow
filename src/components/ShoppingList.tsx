"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import type { GeminiRecipe } from "@/lib/useGeminiVision";

interface ShoppingListProps {
  recipes: GeminiRecipe[];
  detectedItemNames: string[];
}

export default function ShoppingList({ recipes, detectedItemNames }: ShoppingListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (recipes.length === 0) return null;

  // Collect all needed ingredients across all recipes, deduplicated
  const detectedLower = new Set(detectedItemNames.map((n) => n.toLowerCase()));
  const neededMap = new Map<string, string[]>();

  recipes.forEach((recipe) => {
    recipe.ingredients_needed?.forEach((ing) => {
      const key = ing.toLowerCase();
      // Skip if user already has it
      if (detectedLower.has(key)) return;
      const existing = neededMap.get(key);
      if (existing) {
        if (!existing.includes(recipe.name)) existing.push(recipe.name);
      } else {
        neededMap.set(key, [recipe.name]);
      }
    });
  });

  const neededItems = Array.from(neededMap.entries()).map(([name, forRecipes]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    forRecipes,
  }));

  if (neededItems.length === 0) return null;

  const handleCopy = async () => {
    const text = `🛒 Shopping List\n${neededItems.map((i) => `• ${i.name}`).join("\n")}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for mobile
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-orange" />
          <h2 className="text-sm font-semibold">Shopping List</h2>
          <span className="rounded-full bg-orange/20 px-2 py-0.5 text-xs font-medium text-orange">
            {neededItems.length}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 border-t border-border pt-3">
              <p className="text-[10px] text-muted-light mb-2">
                Items you need to buy for the suggested recipes
              </p>
              <div className="space-y-1.5">
                {neededItems.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-lg bg-background px-3 py-2"
                  >
                    <span className="text-xs font-medium text-foreground">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-muted max-w-[50%] text-right truncate">
                      for {item.forRecipes.join(", ")}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleCopy}
                className="mt-3 flex items-center gap-1.5 rounded-full bg-orange/10 border border-orange/20 px-4 py-2 text-xs font-medium text-orange transition-all hover:bg-orange/20 active:scale-95 w-full justify-center"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Shopping List
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
