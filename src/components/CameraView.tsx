"use client";

import { RefObject } from "react";
import { Camera, CameraOff, SwitchCamera, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  detectionCount: number;
  onStart: () => void;
  onStop: () => void;
  onFlip: () => void;
}

export default function CameraView({
  videoRef,
  canvasRef,
  isLoading,
  isStreaming,
  error,
  detectionCount,
  onStart,
  onStop,
  onFlip,
}: CameraViewProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-surface border border-border">
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
              {/* Scan line */}
              <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent animate-scan opacity-40" />

              {/* Corner brackets */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-accent/50 rounded-tl" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-accent/50 rounded-tr" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-accent/50 rounded-bl" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-accent/50 rounded-br" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status badge */}
        <AnimatePresence>
          {isStreaming && (
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
                  ? `${detectionCount} item${detectionCount > 1 ? "s" : ""} detected`
                  : "Scanning..."}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Placeholder when not streaming */}
        {!isStreaming && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface">
            <div className="rounded-full bg-accent-glow p-5">
              <Camera className="h-10 w-10 text-accent" />
            </div>
            <div className="text-center px-6">
              <p className="text-sm font-medium text-foreground/80">
                Point your camera at your fridge
              </p>
              <p className="text-xs text-foreground/40 mt-1">
                AI will detect items and suggest Indian recipes
              </p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface">
            <Loader2 className="h-8 w-8 text-accent animate-spin" />
            <p className="text-sm text-foreground/60">Loading AI model...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-x-0 bottom-0 bg-red-500/90 backdrop-blur-sm px-4 py-2">
            <p className="text-xs text-white text-center">{error}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 p-3 bg-surface/80 backdrop-blur-sm">
        {!isStreaming ? (
          <button
            onClick={onStart}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-accent-dim active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="h-4 w-4" />
            Start Scanning
          </button>
        ) : (
          <>
            <button
              onClick={onFlip}
              className="flex items-center justify-center rounded-full bg-surface-hover border border-border p-2.5 transition-all hover:bg-border active:scale-95"
            >
              <SwitchCamera className="h-5 w-5 text-foreground/70" />
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
