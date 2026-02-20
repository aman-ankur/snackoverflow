"use client";

import { useYoloDetection } from "@/lib/useYoloDetection";
import { getMatchingRecipes } from "@/lib/recipes";
import YoloCameraView from "@/components/YoloCameraView";
import DetectedItems from "@/components/DetectedItems";
import RecipeCard from "@/components/RecipeCard";
import { Sparkles, UtensilsCrossed } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function YoloMode() {
  const yolo = useYoloDetection();

  const yoloIngredients = Array.from(yolo.detectedItems.keys());
  const yoloRecipes = getMatchingRecipes(yoloIngredients);

  return (
    <>
      <YoloCameraView
        videoRef={yolo.videoRef}
        canvasRef={yolo.canvasRef}
        isLoading={yolo.isLoading}
        isStreaming={yolo.isStreaming}
        error={yolo.error}
        detectionCount={yolo.detections.length}
        fps={yolo.fps}
        onStart={yolo.startCamera}
        onStop={yolo.stopCamera}
        onFlip={yolo.flipCamera}
      />

      <DetectedItems items={yolo.detectedItems} onClear={yolo.clearDetectedItems} />

      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="h-4 w-4 text-orange" />
          <h2 className="text-sm font-semibold">Recipe Suggestions</h2>
          {yoloRecipes.length > 0 && (
            <span className="rounded-full bg-orange/20 px-2 py-0.5 text-xs font-medium text-orange">
              {yoloRecipes.length}
            </span>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          {yoloRecipes.length === 0 ? (
            <motion.div
              key="empty-yolo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-surface border border-border py-10 px-6"
            >
              <div className="rounded-full bg-orange-glow p-4">
                <UtensilsCrossed className="h-8 w-8 text-orange/60" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground/50">No recipes yet</p>
                <p className="text-xs text-foreground/30 mt-1">
                  Point camera at food items to get recipe suggestions
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {yoloRecipes.map((recipe, i) => (
                <RecipeCard key={recipe.name} recipe={recipe} index={i} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
