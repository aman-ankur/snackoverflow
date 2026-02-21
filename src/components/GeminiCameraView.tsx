"use client";

import { RefObject } from "react";
import {
  Camera,
  CameraOff,
  SwitchCamera,
  ScanSearch,
  RefreshCw,
  Zap,
  ZapOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GeminiCameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isStreaming: boolean;
  isAnalyzing: boolean;
  autoScan: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  onFlip: () => void;
  onAnalyze: () => void;
  onToggleAutoScan: () => void;
  hasApiKey: boolean;
  showAutoScan?: boolean;
  analyzeButtonLabel?: string;
  readyLabel?: string;
  placeholderTitle?: string;
  placeholderSubtitle?: string;
}

export default function GeminiCameraView({
  videoRef,
  canvasRef,
  isStreaming,
  isAnalyzing,
  autoScan,
  error,
  onStart,
  onStop,
  onFlip,
  onAnalyze,
  onToggleAutoScan,
  hasApiKey,
  showAutoScan = true,
  analyzeButtonLabel = "Analyze",
  readyLabel = "Ready — tap Analyze",
  placeholderTitle = "Point your camera at your fridge",
  placeholderSubtitle = "AI will identify items and suggest recipes",
}: GeminiCameraViewProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-surface border border-border">
      {/* Camera Feed — near full-screen when streaming */}
      <div className={`relative w-full bg-black transition-all duration-300 ${isStreaming ? "h-[50vh]" : "aspect-[4/3]"}`}>
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

        {/* Scanning overlay */}
        <AnimatePresence>
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              {/* Corner brackets */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-accent/50 rounded-tl" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-accent/50 rounded-tr" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-accent/50 rounded-bl" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-accent/50 rounded-br" />

              {/* Analyzing pulse overlay */}
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.15, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 bg-accent"
                />
              )}
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
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-3 w-3 text-accent animate-spin" />
                  <span className="text-xs font-medium text-white/90">
                    Analyzing...
                  </span>
                </>
              ) : showAutoScan && autoScan ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                  </span>
                  <span className="text-xs font-medium text-white/90">
                    Auto-scanning
                  </span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white/50" />
                  </span>
                  <span className="text-xs font-medium text-white/70">
                    {readyLabel}
                  </span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Placeholder when not streaming */}
        {!isStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface">
            <div className="rounded-full bg-accent-glow p-5">
              <Camera className="h-10 w-10 text-accent" />
            </div>
            <div className="text-center px-6">
              <p className="text-sm font-medium text-foreground/80">
                {placeholderTitle}
              </p>
              <p className="text-xs text-foreground/40 mt-1">
                {placeholderSubtitle}
              </p>
            </div>
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
      <div className="flex items-center justify-center gap-2.5 p-3 bg-surface/80 backdrop-blur-sm">
        {!isStreaming ? (
          <button
            onClick={onStart}
            disabled={!hasApiKey}
            className="flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-accent-dim active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="h-4 w-4" />
            Start Camera
          </button>
        ) : (
          <>
            <button
              onClick={onFlip}
              className="flex items-center justify-center rounded-full bg-surface-hover border border-border p-2.5 transition-all hover:bg-border active:scale-95"
              title="Flip camera"
            >
              <SwitchCamera className="h-4 w-4 text-foreground/70" />
            </button>

            <button
              onClick={onAnalyze}
              disabled={isAnalyzing || !hasApiKey}
              className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-accent-dim active:scale-95 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <ScanSearch className="h-4 w-4" />
              )}
              {isAnalyzing ? "Analyzing..." : analyzeButtonLabel}
            </button>

            {showAutoScan && (
              <button
                onClick={onToggleAutoScan}
                disabled={!hasApiKey}
                className={`flex items-center justify-center rounded-full border p-2.5 transition-all active:scale-95 ${
                  autoScan
                    ? "bg-accent/20 border-accent/30 text-accent"
                    : "bg-surface-hover border-border text-foreground/70 hover:bg-border"
                }`}
                title={autoScan ? "Stop auto-scan" : "Auto-scan every 4s"}
              >
                {autoScan ? (
                  <ZapOff className="h-4 w-4" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
              </button>
            )}

            <button
              onClick={onStop}
              className="flex items-center justify-center rounded-full bg-red-500/20 border border-red-500/30 p-2.5 transition-all hover:bg-red-500/30 active:scale-95"
              title="Stop camera"
            >
              <CameraOff className="h-4 w-4 text-red-400" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
