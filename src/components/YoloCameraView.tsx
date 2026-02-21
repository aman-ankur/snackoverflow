"use client";

import { RefObject } from "react";
import { Camera, CameraOff, SwitchCamera, Loader2, Gauge } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface YoloCameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  detectionCount: number;
  fps: number;
  onStart: () => void;
  onStop: () => void;
  onFlip: () => void;
}

export default function YoloCameraView({
  videoRef,
  canvasRef,
  isLoading,
  isStreaming,
  error,
  detectionCount,
  fps,
  onStart,
  onStop,
  onFlip,
}: YoloCameraViewProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-card border border-border">
      {/* Camera Feed */}
      <div className="relative aspect-[4/3] w-full bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Scanning overlay when streaming */}
        <AnimatePresence>
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-accent/50 rounded-tl" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-accent/50 rounded-tr" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-accent/50 rounded-bl" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-accent/50 rounded-br" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status badges */}
        <AnimatePresence>
          {isStreaming && (
            <>
              {/* Detection count */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md px-3 py-1.5 border border-white/10"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                </span>
                <span className="text-xs font-medium text-white/90">
                  {detectionCount > 0
                    ? `${detectionCount} item${detectionCount > 1 ? "s" : ""}`
                    : "Scanning..."}
                </span>
              </motion.div>

              {/* FPS counter */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-1 border border-white/10"
              >
                <Gauge className="h-3 w-3 text-accent/70" />
                <span className="text-[10px] font-mono text-white/60">{fps} FPS</span>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Placeholder */}
        {!isStreaming && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card">
            <div className="rounded-full bg-accent-glow p-5">
              <Camera className="h-10 w-10 text-accent" />
            </div>
            <div className="text-center px-6">
              <p className="text-sm font-medium text-foreground">
                YOLO On-Device Detection
              </p>
              <p className="text-xs text-muted mt-1">
                Real-time object detection running entirely in your browser
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card">
            <Loader2 className="h-8 w-8 text-accent animate-spin" />
            <p className="text-sm text-muted">Loading YOLO model (12MB)...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-x-0 bottom-0 bg-red-500/90 backdrop-blur-sm px-4 py-2">
            <p className="text-xs text-white text-center">{error}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 p-3 bg-card">
        {!isStreaming ? (
          <button
            onClick={onStart}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dim active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="h-4 w-4" />
            Start Scanning
          </button>
        ) : (
          <>
            <button
              onClick={onFlip}
              className="flex items-center justify-center rounded-full bg-card-hover border border-border p-2.5 transition-all hover:bg-border active:scale-95"
            >
              <SwitchCamera className="h-5 w-5 text-muted" />
            </button>
            <button
              onClick={onStop}
              className="flex items-center gap-2 rounded-full bg-red-500/20 border border-red-500/30 px-5 py-2.5 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/30 active:scale-95"
            >
              <CameraOff className="h-4 w-4" />
              Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}
