"use client";

import { useState } from "react";
import { useGeminiVision } from "@/lib/useGeminiVision";
import { useYoloDetection } from "@/lib/useYoloDetection";
import { getMatchingRecipes } from "@/lib/recipes";
import GeminiCameraView from "@/components/GeminiCameraView";
import GeminiDetectedItems from "@/components/GeminiDetectedItems";
import GeminiRecipeCard from "@/components/GeminiRecipeCard";
import YoloCameraView from "@/components/YoloCameraView";
import DetectedItems from "@/components/DetectedItems";
import RecipeCard from "@/components/RecipeCard";
import ModeSwitcher, { DetectionMode } from "@/components/ModeSwitcher";
import { Scan, Sparkles, UtensilsCrossed, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [mode, setMode] = useState<DetectionMode>("gemini");

  // Gemini/Groq cloud mode
  const gemini = useGeminiVision();

  // YOLO on-device mode
  const yolo = useYoloDetection();

  // Offline recipe matching for YOLO mode
  const yoloIngredients = Array.from(yolo.detectedItems.keys());
  const yoloRecipes = getMatchingRecipes(yoloIngredients);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
              <Scan className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">
                FridgeVision
              </h1>
              <p className="text-[10px] text-foreground/40 -mt-0.5">
                Smart Kitchen Assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent/10 border border-accent/20 px-2.5 py-1 text-[10px] font-medium text-accent">
              {mode === "yolo" ? "On-Device" : "Cloud AI"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-lg px-4 py-4 pb-20 space-y-4">
        {/* Mode Switcher */}
        <ModeSwitcher mode={mode} onModeChange={setMode} />

        {/* ===== GEMINI / GROQ CLOUD MODE ===== */}
        {mode === "gemini" && (
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
              items={gemini.analysis?.items || []}
              onClear={gemini.clearAnalysis}
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

            {/* Gemini Recipes */}
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
        )}

        {/* ===== YOLO ON-DEVICE MODE ===== */}
        {mode === "yolo" && (
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

            {/* YOLO Recipes (offline matching) */}
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
        )}

        {/* Footer */}
        <div className="text-center pt-4 pb-2">
          <p className="text-[10px] text-foreground/20">
            {mode === "yolo"
              ? "YOLOv8n via ONNX Runtime • Runs entirely on your device"
              : "Powered by Gemini / Groq • Your images are not stored"}
          </p>
        </div>
      </main>
    </div>
  );
}
