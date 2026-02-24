"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { DishAnalysisResult, DishNutrition, MealType } from "@/lib/dishTypes";

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function normalizeDish(raw: unknown): DishNutrition | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;

  const confidenceRaw =
    typeof input.confidence === "string" ? input.confidence.toLowerCase().trim() : "medium";

  return {
    name: typeof input.name === "string" && input.name.trim() ? input.name.trim() : "Unknown Dish",
    hindi: typeof input.hindi === "string" ? input.hindi.trim() : "",
    portion: typeof input.portion === "string" && input.portion.trim() ? input.portion.trim() : "1 serving",
    estimated_weight_g: Math.max(0, Math.round(toNumber(input.estimated_weight_g))),
    calories: Math.max(0, Math.round(toNumber(input.calories))),
    protein_g: Math.max(0, Math.round(toNumber(input.protein_g))),
    carbs_g: Math.max(0, Math.round(toNumber(input.carbs_g))),
    fat_g: Math.max(0, Math.round(toNumber(input.fat_g))),
    fiber_g: Math.max(0, Math.round(toNumber(input.fiber_g))),
    ingredients: Array.isArray(input.ingredients)
      ? input.ingredients.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      : [],
    confidence:
      confidenceRaw === "high" || confidenceRaw === "medium" || confidenceRaw === "low"
        ? confidenceRaw
        : "medium",
    tags: Array.isArray(input.tags)
      ? input.tags.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      : [],
    healthTip:
      typeof input.healthTip === "string" && input.healthTip.trim().length > 0
        ? input.healthTip.trim()
        : "Balance this meal with vegetables and hydration.",
    reasoning:
      typeof input.reasoning === "string" && input.reasoning.trim().length > 0
        ? input.reasoning.trim()
        : "",
  };
}

function normalizeResult(raw: unknown): DishAnalysisResult {
  if (!raw || typeof raw !== "object") {
    return {
      dishes: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
    };
  }

  const input = raw as Record<string, unknown>;
  const dishes = Array.isArray(input.dishes)
    ? input.dishes.map(normalizeDish).filter((dish): dish is DishNutrition => Boolean(dish))
    : [];

  return {
    dishes,
    totalCalories: Math.max(
      0,
      Math.round(toNumber(input.totalCalories) || dishes.reduce((sum, d) => sum + d.calories, 0))
    ),
    totalProtein: Math.max(
      0,
      Math.round(toNumber(input.totalProtein) || dishes.reduce((sum, d) => sum + d.protein_g, 0))
    ),
    totalCarbs: Math.max(
      0,
      Math.round(toNumber(input.totalCarbs) || dishes.reduce((sum, d) => sum + d.carbs_g, 0))
    ),
    totalFat: Math.max(
      0,
      Math.round(toNumber(input.totalFat) || dishes.reduce((sum, d) => sum + d.fat_g, 0))
    ),
    totalFiber: Math.max(
      0,
      Math.round(toNumber(input.totalFiber) || dishes.reduce((sum, d) => sum + d.fiber_g, 0))
    ),
    ...(typeof input.provider === "string" ? { provider: input.provider } : {}),
  };
}

export function useDishScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastFrameRef = useRef<string | null>(null);

  const [mockMode] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mock") === "scan"
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [analysis, setAnalysis] = useState<DishAnalysisResult | null>(null);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<Date | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);

  useEffect(() => {
    captureCanvasRef.current = document.createElement("canvas");
  }, []);

  const startCamera = useCallback(async () => {
    if (mockMode) {
      setIsStreaming(true);
      setError(null);
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsStreaming(true);
      setError(null);
    } catch {
      setError("Camera access denied. Please allow camera permissions.");
    }
  }, [facingMode, mockMode]);

  const stopCamera = useCallback(() => {
    if (mockMode) {
      setIsStreaming(false);
      return;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
  }, [mockMode]);

  const flipCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  useEffect(() => {
    if (isStreaming) {
      startCamera();
    }
  }, [facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    const maxWidth = 1024;
    const scale = Math.min(maxWidth / video.videoWidth, 1);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  }, []);

  const analyzeFrame = useCallback(async () => {
    if (isAnalyzing) return;

    if (mockMode) {
      setIsAnalyzing(true);
      setError(null);
      try {
        const { MOCK_FOOD_IMAGE, MOCK_SCAN_RESULT, MOCK_ANALYSIS_DELAY_MS } = await import(
          "@/lib/mockScanData"
        );
        setCapturedFrame(MOCK_FOOD_IMAGE);
        lastFrameRef.current = MOCK_FOOD_IMAGE;
        await new Promise((resolve) => setTimeout(resolve, MOCK_ANALYSIS_DELAY_MS));
        setAnalysis(MOCK_SCAN_RESULT);
        setLastAnalyzedAt(new Date());
        setScanCount((count) => count + 1);
      } catch {
        setError("Mock scan failed");
      } finally {
        setIsAnalyzing(false);
      }
      return;
    }

    const frame = captureFrame();
    if (!frame) {
      setError("Could not capture frame from camera");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setCapturedFrame(frame);
    lastFrameRef.current = frame;

    try {
      const res = await fetch("/api/analyze-dish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: frame, mealType }),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const message =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "Dish analysis failed";
        throw new Error(message);
      }

      const result = normalizeResult(data);
      setAnalysis(result);
      setLastAnalyzedAt(new Date());
      setScanCount((count) => count + 1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Dish analysis failed";
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, captureFrame, mealType, mockMode]);

  const correctDish = useCallback(async (dishIndex: number, correctedName: string) => {
    const frame = lastFrameRef.current;
    if (!frame || isAnalyzing) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze-dish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: frame,
          mealType,
          correction: `Dish #${dishIndex + 1} is actually "${correctedName}". Re-analyze with this correction.`,
        }),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const message =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "Correction failed";
        throw new Error(message);
      }

      const result = normalizeResult(data);
      setAnalysis(result);
      setLastAnalyzedAt(new Date());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Correction failed";
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, mealType]);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setLastAnalyzedAt(null);
    setScanCount(0);
    setCapturedFrame(null);
    lastFrameRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    isStreaming,
    isAnalyzing,
    error,
    analysis,
    mealType,
    setMealType,
    lastAnalyzedAt,
    scanCount,
    capturedFrame,
    mockMode,
    startCamera,
    stopCamera,
    flipCamera,
    analyzeFrame,
    correctDish,
    clearAnalysis,
  };
}
