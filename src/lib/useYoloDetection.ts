"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { loadYoloModel, isYoloLoaded, detectFrame, YoloDetection } from "./yoloInference";
import { YOLO_TO_INGREDIENT } from "./yoloLabels";

export function useYoloDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const preprocessCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [detections, setDetections] = useState<YoloDetection[]>([]);
  const [detectedItems, setDetectedItems] = useState<Map<string, number>>(new Map());
  const [fps, setFps] = useState(0);

  // Create offscreen canvas for preprocessing
  useEffect(() => {
    preprocessCanvasRef.current = document.createElement("canvas");
  }, []);

  // Load YOLO model
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        await loadYoloModel();
        if (!cancelled) setIsLoading(false);
      } catch {
        if (!cancelled) {
          setError("Failed to load YOLO model");
          setIsLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
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
    cancelAnimationFrame(animFrameRef.current);
    setIsStreaming(false);
    setDetections([]);
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

  // Detection loop
  useEffect(() => {
    if (!isStreaming || !isYoloLoaded() || !videoRef.current || !preprocessCanvasRef.current) return;

    const video = videoRef.current;
    const ppCanvas = preprocessCanvasRef.current;
    let running = true;
    let lastTime = performance.now();
    let frameCounter = 0;

    async function detect() {
      if (!running || !video || video.readyState < 2) {
        if (running) animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        const results = await detectFrame(video, ppCanvas);
        setDetections(results);

        // Accumulate detected food items
        setDetectedItems((prev) => {
          const next = new Map(prev);
          results.forEach((d) => {
            const ingredient = YOLO_TO_INGREDIENT[d.label];
            if (ingredient) {
              const existing = next.get(ingredient) || 0;
              next.set(ingredient, Math.max(existing, d.score));
            }
          });
          return next;
        });

        // Draw bounding boxes on overlay canvas
        if (overlayCanvasRef.current) {
          const canvas = overlayCanvasRef.current;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            results.forEach((d) => {
              const [x, y, w, h] = d.bbox;

              // Bounding box
              ctx.strokeStyle = "#22c55e";
              ctx.lineWidth = 2;
              ctx.setLineDash([6, 3]);
              ctx.strokeRect(x, y, w, h);

              // Corner accents
              ctx.setLineDash([]);
              ctx.lineWidth = 3;
              const cornerLen = 12;

              ctx.beginPath();
              ctx.moveTo(x, y + cornerLen); ctx.lineTo(x, y); ctx.lineTo(x + cornerLen, y);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(x + w - cornerLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cornerLen);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(x, y + h - cornerLen); ctx.lineTo(x, y + h); ctx.lineTo(x + cornerLen, y + h);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(x + w - cornerLen, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cornerLen);
              ctx.stroke();

              // Label
              const label = `${d.label} ${Math.round(d.score * 100)}%`;
              ctx.font = "bold 12px system-ui";
              const textWidth = ctx.measureText(label).width;
              ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
              ctx.fillRect(x, y - 22, textWidth + 10, 20);
              ctx.fillStyle = "#22c55e";
              ctx.fillText(label, x + 5, y - 7);
            });
          }
        }

        // FPS counter
        frameCounter++;
        const now = performance.now();
        if (now - lastTime >= 1000) {
          setFps(frameCounter);
          frameCounter = 0;
          lastTime = now;
        }
      } catch {
        // Silently handle detection errors
      }

      if (running) {
        animFrameRef.current = requestAnimationFrame(detect);
      }
    }

    detect();

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isStreaming, isLoading]);

  const clearDetectedItems = useCallback(() => {
    setDetectedItems(new Map());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return {
    videoRef,
    canvasRef: overlayCanvasRef,
    isLoading,
    isStreaming,
    detections,
    detectedItems,
    error,
    fps,
    startCamera,
    stopCamera,
    flipCamera,
    clearDetectedItems,
  };
}
