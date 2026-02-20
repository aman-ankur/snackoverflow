"use client";

import { useGeminiVision } from "@/lib/useGeminiVision";
import GeminiCameraView from "@/components/GeminiCameraView";
import GeminiDetectedItems from "@/components/GeminiDetectedItems";
import GeminiRecipeCard from "@/components/GeminiRecipeCard";
import { Sparkles, UtensilsCrossed, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GeminiMode() {
  const gemini = useGeminiVision();

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

      <GeminiDetectedItems
        items={gemini.allItems}
        onClear={gemini.clearAnalysis}
        onRemoveItem={gemini.removeItem}
        frameCount={gemini.frameCount}
        lastAnalyzedAt={gemini.lastAnalyzedAt}
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
            <p className="text-xs text-foreground/60 leading-relaxed">
              {gemini.analysis.tip}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-surface border border-border py-10 px-6"
            >
              <div className="rounded-full bg-orange-glow p-4">
                <UtensilsCrossed className="h-8 w-8 text-orange/60" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground/50">No recipes yet</p>
                <p className="text-xs text-foreground/30 mt-1">
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
