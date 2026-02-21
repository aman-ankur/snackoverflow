"use client";

import { useEffect, useRef } from "react";
import { useGeminiVision } from "@/lib/useGeminiVision";
import { useExpiryTracker } from "@/lib/useExpiryTracker";
import GeminiCameraView from "@/components/GeminiCameraView";
import GeminiDetectedItems from "@/components/GeminiDetectedItems";
import GeminiRecipeCard from "@/components/GeminiRecipeCard";
import DietaryFilter from "@/components/DietaryFilter";
import ShoppingList from "@/components/ShoppingList";
import ExpiryTracker from "@/components/ExpiryTracker";
import MealPlanner from "@/components/MealPlanner";
import { Sparkles, UtensilsCrossed, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GeminiMode() {
  const gemini = useGeminiVision();
  const expiry = useExpiryTracker();

  // Auto-add detected items to expiry tracker when new items appear
  const prevItemCountRef = useRef(0);
  useEffect(() => {
    if (gemini.allItems.length > prevItemCountRef.current) {
      expiry.addItems(
        gemini.allItems.map((i) => ({ name: i.name, hindi: i.hindi }))
      );
    }
    prevItemCountRef.current = gemini.allItems.length;
  }, [gemini.allItems]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <GeminiCameraView
        videoRef={gemini.videoRef}
        canvasRef={gemini.canvasRef}
        isStreaming={gemini.isStreaming}
        isAnalyzing={gemini.isAnalyzing}
        autoScan={gemini.autoScan}
        error={gemini.error}
        onStart={gemini.startCamera}
        onStop={gemini.stopCamera}
        onFlip={gemini.flipCamera}
        onAnalyze={gemini.analyzeFrame}
        onToggleAutoScan={gemini.toggleAutoScan}
        hasApiKey={true}
      />

      {/* Dietary Filter */}
      <div className="rounded-2xl bg-card border border-border p-3">
        <p className="text-[10px] text-muted mb-2 px-1">Diet Preference</p>
        <DietaryFilter value={gemini.dietaryFilter} onChange={gemini.setDietaryFilter} />
      </div>

      <GeminiDetectedItems
        items={gemini.allItems}
        onClear={gemini.clearAnalysis}
        onRemoveItem={gemini.removeItem}
        frameCount={gemini.frameCount}
        lastAnalyzedAt={gemini.lastAnalyzedAt}
      />

      {/* Expiry / Freshness Tracker */}
      <ExpiryTracker
        items={expiry.trackedItems}
        expiringCount={expiry.expiringCount}
        onSetExpiry={expiry.setExpiry}
        onRemove={expiry.removeTrackedItem}
        onClearAll={expiry.clearAll}
        getDaysLeft={expiry.getDaysLeft}
      />

      <AnimatePresence>
        {gemini.analysis?.tip && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex items-start gap-3 rounded-2xl bg-orange/5 border border-orange/15 p-4"
          >
            <Lightbulb className="h-4 w-4 text-orange shrink-0 mt-0.5" />
            <p className="text-xs text-foreground leading-relaxed">
              {gemini.analysis.tip}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shopping List */}
      <ShoppingList
        recipes={gemini.analysis?.recipes || []}
        detectedItemNames={gemini.allItems.map((i) => i.name)}
      />

      {/* Meal Planner */}
      <MealPlanner
        availableRecipes={gemini.analysis?.recipes || []}
        detectedItemNames={gemini.allItems.map((i) => i.name)}
      />

      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="h-4 w-4 text-orange" />
          <h2 className="text-sm font-semibold">Recipe Suggestions</h2>
          {gemini.analysis?.recipes && gemini.analysis.recipes.length > 0 && (
            <span className="rounded-full bg-orange/20 px-2 py-0.5 text-xs font-medium text-orange">
              {gemini.analysis.recipes.length}
            </span>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          {!gemini.analysis?.recipes || gemini.analysis.recipes.length === 0 ? (
            <motion.div
              key="empty-gemini"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-card border border-border py-10 px-6"
            >
              <div className="rounded-full bg-orange-glow p-4">
                <UtensilsCrossed className="h-8 w-8 text-orange/60" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-muted">No recipes yet</p>
                <p className="text-xs text-muted mt-1">
                  Scan your fridge to get AI-powered Indian recipe suggestions
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {gemini.analysis.recipes.map((recipe, i) => (
                <GeminiRecipeCard key={`${recipe.name}-${i}`} recipe={recipe} index={i} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
