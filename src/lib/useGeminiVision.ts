"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export interface DetectedItem {
  name: string;
  hindi: string;
  quantity: string;
  confidence: "high" | "medium" | "low";
}

export interface GeminiRecipe {
  name: string;
  hindi: string;
  time: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  ingredients_used: string[];
  ingredients_needed: string[];
  steps: string[];
  tags: string[];
}

export interface AnalysisResult {
  items: DetectedItem[];
  recipes: GeminiRecipe[];
  tip: string;
}

export function useGeminiVision() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [allItems, setAllItems] = useState<DetectedItem[]>([]);
  const [removedItems, setRemovedItems] = useState<Set<string>>(new Set());
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<Date | null>(null);
  const [autoScan, setAutoScan] = useState(false);
  const [frameCount, setFrameCount] = useState(0);

  // Create offscreen canvas for frame capture
  useEffect(() => {
    captureCanvasRef.current = document.createElement("canvas");
  }, []);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
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
        setIsStreaming(true);
        setError(null);
      }
    } catch {
      setError("Camera access denied. Please allow camera permissions.");
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsStreaming(false);
    setAutoScan(false);
  }, []);

  const flipCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (isStreaming) {
      startCamera();
    }
  }, [facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Capture current frame as base64 JPEG
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    // Downscale to max 512px wide to reduce token usage
    const maxWidth = 512;
    const scale = Math.min(maxWidth / video.videoWidth, 1);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.6);
  }, []);

  // Analyze a single frame with Gemini
  const analyzeFrame = useCallback(async () => {
    if (isAnalyzing) return;

    const frame = captureFrame();
    if (!frame) {
      setError("Could not capture frame from camera");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: frame }),
      });

      const data = await res.json();

      if (!res.ok) {
        // On rate limit, stop auto-scan and show friendly message
        if (res.status === 429) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setAutoScan(false);
        }
        throw new Error(data.error || "Analysis failed");
      }

      const result = data as AnalysisResult;
      setAnalysis(result);

      // Accumulate items across scans (deduplicate by name, keep highest confidence)
      setAllItems((prev) => {
        const merged = new Map<string, DetectedItem>();
        // Existing items first
        prev.forEach((item) => merged.set(item.name.toLowerCase(), item));
        // New items override if higher confidence
        const confRank = { high: 3, medium: 2, low: 1 };
        result.items.forEach((item) => {
          const key = item.name.toLowerCase();
          const existing = merged.get(key);
          if (!existing || confRank[item.confidence] > confRank[existing.confidence]) {
            merged.set(key, item);
          }
        });
        return Array.from(merged.values());
      });

      setLastAnalyzedAt(new Date());
      setFrameCount((c) => c + 1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, captureFrame]);

  // Auto-scan: analyze every N seconds
  const toggleAutoScan = useCallback(() => {
    if (autoScan) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setAutoScan(false);
    } else {
      setAutoScan(true);
      // Analyze immediately, then every 4 seconds
      analyzeFrame();
      intervalRef.current = setInterval(() => {
        analyzeFrame();
      }, 4000);
    }
  }, [autoScan, analyzeFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const removeItem = useCallback((itemName: string) => {
    setAllItems((prev) => prev.filter((i) => i.name !== itemName));
    setRemovedItems((prev) => new Set(prev).add(itemName.toLowerCase()));
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setAllItems([]);
    setRemovedItems(new Set());
    setFrameCount(0);
    setLastAnalyzedAt(null);
  }, []);

  // Filter out removed items from accumulated list
  const visibleItems = allItems.filter(
    (item) => !removedItems.has(item.name.toLowerCase())
  );

  return {
    videoRef,
    canvasRef,
    isStreaming,
    isAnalyzing,
    error,
    analysis,
    allItems: visibleItems,
    lastAnalyzedAt,
    autoScan,
    frameCount,
    startCamera,
    stopCamera,
    flipCamera,
    analyzeFrame,
    toggleAutoScan,
    removeItem,
    clearAnalysis,
  };
}
