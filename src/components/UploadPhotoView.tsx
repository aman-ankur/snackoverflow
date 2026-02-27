"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, ImageIcon, X } from "lucide-react";

interface UploadPhotoViewProps {
  isAnalyzing: boolean;
  capturedFrame: string | null;
  hasResults: boolean;
  onAnalyze: (base64: string) => void;
  onClear: () => void;
}

function compressImage(file: File, maxWidth = 768, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(maxWidth / img.width, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export default function UploadPhotoView({ isAnalyzing, capturedFrame, hasResults, onAnalyze, onClear }: UploadPhotoViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    setError(null);
    try {
      const compressed = await compressImage(file);
      setPreview(compressed);
      onAnalyze(compressed);
    } catch {
      setError("Failed to process image");
    }
  }, [onAnalyze]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so same file can be re-selected
    e.target.value = "";
  }, [handleFile]);

  const handleClear = useCallback(() => {
    setPreview(null);
    setError(null);
    onClear();
  }, [onClear]);

  const displayImage = capturedFrame || preview;

  // Show preview if we have results or a captured frame
  if (displayImage && (hasResults || isAnalyzing)) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-border bg-card">
        <img src={displayImage} alt="Uploaded food" className="w-full object-cover max-h-64" />
        {!isAnalyzing && (
          <button
            onClick={handleClear}
            className="absolute top-3 right-3 rounded-full bg-black/50 p-1.5 text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  // Upload zone
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isAnalyzing}
        className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card py-12 transition-colors hover:border-accent/40 hover:bg-accent-light/30 disabled:opacity-50"
      >
        <div className="rounded-full bg-accent-light p-3">
          {preview ? (
            <ImageIcon className="h-6 w-6 text-accent-dim" />
          ) : (
            <Upload className="h-6 w-6 text-accent-dim" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-foreground">Upload a food photo</p>
          <p className="text-xs text-muted mt-1">Tap to choose from your gallery</p>
        </div>
      </button>
      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
    </motion.div>
  );
}
