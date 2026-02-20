"use client";

import { useState, useCallback, useRef } from "react";
import {
  Share2,
  MessageCircle,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Send,
  Mic,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { GeminiRecipe } from "@/lib/useGeminiVision";

interface ShareRecipeProps {
  recipe: GeminiRecipe;
}

function buildMessage(recipe: GeminiRecipe): string {
  const lines = [
    `🍳 *${recipe.name}* (${recipe.hindi})`,
    `⏱️ ${recipe.time} • ${recipe.difficulty}`,
    ``,
    `📝 *Ingredients available:*`,
    ...(recipe.ingredients_used?.map((i) => `  ✅ ${i}`) || []),
  ];

  if (recipe.ingredients_needed?.length) {
    lines.push(``, `🛒 *Also need:*`);
    lines.push(...recipe.ingredients_needed.map((i) => `  • ${i}`));
  }

  lines.push(``, `— Sent from FridgeVision 🧊`);
  return lines.join("\n");
}

const SERVING_OPTIONS = [1, 2, 3, 4] as const;

export default function ShareRecipe({ recipe }: ShareRecipeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hindiLoading, setHindiLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [hindiText, setHindiText] = useState<string | null>(null);
  const [servings, setServings] = useState(2);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const message = buildMessage(recipe);

  // Clear cached hindi text when servings change
  const handleServingsChange = useCallback((n: number) => {
    setServings(n);
    setHindiText(null);
  }, []);

  // Generate Hindi text message via AI
  const generateHindiText = useCallback(async (): Promise<string | null> => {
    if (hindiText) return hindiText;
    setHindiLoading(true);
    try {
      const res = await fetch("/api/hindi-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeName: recipe.name,
          recipeHindi: recipe.hindi,
          ingredientsUsed: recipe.ingredients_used,
          servings,
        }),
      });
      const data = await res.json();
      if (data.hindiText) {
        setHindiText(data.hindiText);
        return data.hindiText;
      }
      return null;
    } catch {
      return null;
    } finally {
      setHindiLoading(false);
    }
  }, [hindiText, recipe, servings]);

  // Send Hindi text via WhatsApp
  const handleHindiWhatsApp = useCallback(async () => {
    const text = await generateHindiText();
    if (text) {
      const encoded = encodeURIComponent(text);
      window.open(`https://wa.me/?text=${encoded}`, "_blank");
    }
    setIsOpen(false);
  }, [generateHindiText]);

  // Generate Hindi audio and share/play
  const handleHindiAudio = useCallback(async () => {
    setAudioLoading(true);
    try {
      // Step 1: Get Hindi text
      const text = await generateHindiText();
      if (!text) {
        setAudioLoading(false);
        return;
      }

      // Step 2: Convert to audio via OpenAI TTS
      const res = await fetch("/api/hindi-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("TTS error:", err.error);
        setAudioLoading(false);
        return;
      }

      const audioBlob = await res.blob();
      const audioFile = new File([audioBlob], `${recipe.name}-hindi.mp3`, {
        type: "audio/mpeg",
      });

      // Try sharing via Web Share API (works on mobile → WhatsApp)
      if (typeof navigator !== "undefined" && typeof navigator.share === "function" && navigator.canShare?.({ files: [audioFile] })) {
        try {
          await navigator.share({
            title: `🍳 ${recipe.hindi}`,
            text: text,
            files: [audioFile],
          });
          setIsOpen(false);
          setAudioLoading(false);
          return;
        } catch {
          // User cancelled or share failed, fall through to play
        }
      }

      // Fallback: play audio in browser + offer download
      const url = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();

      // Also download the file
      const a = document.createElement("a");
      a.href = url;
      a.download = `${recipe.name}-hindi.mp3`;
      a.click();
    } catch (err) {
      console.error("Audio generation failed:", err);
    } finally {
      setAudioLoading(false);
      setIsOpen(false);
    }
  }, [generateHindiText, recipe]);

  // English WhatsApp
  const handleWhatsApp = useCallback(() => {
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
    setIsOpen(false);
  }, [message]);

  // Copy
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = message;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message]);

  // Read aloud in English
  const handleSpeak = useCallback(() => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const text = `Recipe: ${recipe.name}. ${recipe.description}. Time: ${recipe.time}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }, [isSpeaking, recipe]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-3 py-1.5 text-[10px] font-medium text-accent transition-all hover:bg-accent/20 active:scale-95"
      >
        <Send className="h-3 w-3" />
        Send to Cook
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl bg-surface border border-border shadow-xl overflow-hidden"
            >
              <div className="p-1.5 space-y-0.5">
                {/* Serving size picker */}
                <div className="px-3 pt-2 pb-1.5">
                  <span className="text-[10px] text-foreground/40 block mb-1.5">Servings</span>
                  <div className="flex items-center gap-1">
                    {SERVING_OPTIONS.map((n) => (
                      <button
                        key={n}
                        onClick={() => handleServingsChange(n)}
                        className={`flex items-center justify-center w-9 h-8 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                          servings === n
                            ? "bg-accent text-background shadow-sm"
                            : "bg-foreground/5 text-foreground/50 border border-foreground/10"
                        }`}
                      >
                        {n}🧑
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border my-1" />

                {/* Section: Hindi (for cook) */}
                <div className="px-3 pt-1 pb-1">
                  <span className="text-[10px] font-semibold text-orange uppercase tracking-wider">
                    हिंदी — For Cook
                  </span>
                </div>

                <button
                  onClick={handleHindiAudio}
                  disabled={audioLoading}
                  className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-left hover:bg-surface-hover transition-colors disabled:opacity-50"
                >
                  {audioLoading ? (
                    <Loader2 className="h-4 w-4 text-orange animate-spin" />
                  ) : (
                    <Mic className="h-4 w-4 text-orange" />
                  )}
                  <div>
                    <span className="text-xs font-medium text-foreground/80 block">
                      {audioLoading ? "Generating..." : "Hindi Audio Message"}
                    </span>
                    <span className="text-[10px] text-foreground/30">
                      AI voice in Hindi → share on WhatsApp
                    </span>
                  </div>
                </button>

                <button
                  onClick={handleHindiWhatsApp}
                  disabled={hindiLoading}
                  className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-left hover:bg-surface-hover transition-colors disabled:opacity-50"
                >
                  {hindiLoading ? (
                    <Loader2 className="h-4 w-4 text-green-400 animate-spin" />
                  ) : (
                    <MessageCircle className="h-4 w-4 text-green-400" />
                  )}
                  <div>
                    <span className="text-xs font-medium text-foreground/80 block">
                      {hindiLoading ? "Generating..." : "Hindi Text on WhatsApp"}
                    </span>
                    <span className="text-[10px] text-foreground/30">
                      हिंदी में message भेजें
                    </span>
                  </div>
                </button>

                <div className="border-t border-border my-1" />

                {/* Section: English */}
                <div className="px-3 pt-1 pb-1">
                  <span className="text-[10px] font-semibold text-foreground/30 uppercase tracking-wider">
                    English
                  </span>
                </div>

                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-left hover:bg-surface-hover transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-green-400" />
                  <div>
                    <span className="text-xs font-medium text-foreground/80 block">WhatsApp (English)</span>
                    <span className="text-[10px] text-foreground/30">Send recipe in English</span>
                  </div>
                </button>

                <button
                  onClick={handleSpeak}
                  className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-left hover:bg-surface-hover transition-colors"
                >
                  {isSpeaking ? (
                    <VolumeX className="h-4 w-4 text-red-400" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-purple-400" />
                  )}
                  <div>
                    <span className="text-xs font-medium text-foreground/80 block">
                      {isSpeaking ? "Stop" : "Read Aloud"}
                    </span>
                    <span className="text-[10px] text-foreground/30">English voice</span>
                  </div>
                </button>

                {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                  <button
                    onClick={async () => {
                      try {
                        await navigator.share({ title: recipe.name, text: message });
                      } catch { /* cancelled */ }
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-left hover:bg-surface-hover transition-colors"
                  >
                    <Share2 className="h-4 w-4 text-foreground/40" />
                    <div>
                      <span className="text-xs font-medium text-foreground/80 block">Share via...</span>
                      <span className="text-[10px] text-foreground/30">Any app</span>
                    </div>
                  </button>
                )}

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-left hover:bg-surface-hover transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-foreground/40" />
                  )}
                  <div>
                    <span className="text-xs font-medium text-foreground/80 block">
                      {copied ? "Copied!" : "Copy Text"}
                    </span>
                    <span className="text-[10px] text-foreground/30">Clipboard</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
