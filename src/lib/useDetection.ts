"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import { LABEL_TO_INGREDIENT } from "./recipes";

export interface Detection {
  label: string;
  ingredient: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

export function useDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [detectedItems, setDetectedItems] = useState<Map<string, number>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  // Load model
  useEffect(() => {
    let cancelled = false;
    async function loadModel() {
      try {
        setIsLoading(true);
        const model = await cocoSsd.load({ base: "lite_mobilenet_v2" });
        if (!cancelled) {
          modelRef.current = model;
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load AI model. Please refresh.");
          setIsLoading(false);
        }
      }
    }
    loadModel();
    return () => { cancelled = true; };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      // Stop existing stream
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
    } catch (err) {
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
    if (!isStreaming || !modelRef.current || !videoRef.current) return;

    const video = videoRef.current;
    const model = modelRef.current;
    let running = true;

    async function detect() {
      if (!running || !video || video.readyState < 2) {
        if (running) animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        const predictions = await model.detect(video, 10, 0.4);

        const mapped: Detection[] = predictions
          .map((p) => ({
            label: p.class,
            ingredient: LABEL_TO_INGREDIENT[p.class] || p.class,
            score: p.score,
            bbox: p.bbox as [number, number, number, number],
          }));

        setDetections(mapped);

        // Accumulate detected items with confidence
        setDetectedItems((prev) => {
          const next = new Map(prev);
          mapped.forEach((d) => {
            const existing = next.get(d.ingredient) || 0;
            next.set(d.ingredient, Math.max(existing, d.score));
          });
          return next;
        });

        // Draw bounding boxes on canvas
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            mapped.forEach((d) => {
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

              // Top-left
              ctx.beginPath();
              ctx.moveTo(x, y + cornerLen);
              ctx.lineTo(x, y);
              ctx.lineTo(x + cornerLen, y);
              ctx.stroke();

              // Top-right
              ctx.beginPath();
              ctx.moveTo(x + w - cornerLen, y);
              ctx.lineTo(x + w, y);
              ctx.lineTo(x + w, y + cornerLen);
              ctx.stroke();

              // Bottom-left
              ctx.beginPath();
              ctx.moveTo(x, y + h - cornerLen);
              ctx.lineTo(x, y + h);
              ctx.lineTo(x + cornerLen, y + h);
              ctx.stroke();

              // Bottom-right
              ctx.beginPath();
              ctx.moveTo(x + w - cornerLen, y + h);
              ctx.lineTo(x + w, y + h);
              ctx.lineTo(x + w, y + h - cornerLen);
              ctx.stroke();

              // Label background
              const label = `${d.ingredient} ${Math.round(d.score * 100)}%`;
              ctx.font = "bold 13px system-ui";
              const textWidth = ctx.measureText(label).width;
              ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
              ctx.fillRect(x, y - 24, textWidth + 12, 22);

              // Label text
              ctx.fillStyle = "#22c55e";
              ctx.fillText(label, x + 6, y - 8);
            });
          }
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
  }, [isStreaming]);

  const clearDetectedItems = useCallback(() => {
    setDetectedItems(new Map());
  }, []);

  return {
    videoRef,
    canvasRef,
    isLoading,
    isStreaming,
    detections,
    detectedItems,
    error,
    startCamera,
    stopCamera,
    flipCamera,
    clearDetectedItems,
  };
}
