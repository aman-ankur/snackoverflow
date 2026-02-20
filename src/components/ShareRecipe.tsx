"use client";

import { useState, useCallback } from "react";
import {
  Share2,
  MessageCircle,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Send,
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
    `📝 *Ingredients you have:*`,
    ...(recipe.ingredients_used?.map((i) => `  ✅ ${i}`) || []),
  ];

  if (recipe.ingredients_needed?.length) {
    lines.push(``, `🛒 *Also need:*`);
    lines.push(...recipe.ingredients_needed.map((i) => `  • ${i}`));
  }

  lines.push(``, `👨‍🍳 *Steps:*`);
  recipe.steps?.forEach((step, i) => {
    lines.push(`  ${i + 1}. ${step}`);
  });

  lines.push(``, `— Sent from FridgeVision 🧊`);
  return lines.join("\n");
}

function buildPlainMessage(recipe: GeminiRecipe): string {
  return `Please cook ${recipe.name} (${recipe.hindi}) today. It takes ${recipe.time} and is ${recipe.difficulty} difficulty. Ingredients: ${recipe.ingredients_used?.join(", ")}. Steps: ${recipe.steps?.map((s, i) => `${i + 1}) ${s}`).join(" ")}`;
}

export default function ShareRecipe({ recipe }: ShareRecipeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const message = buildMessage(recipe);
  const plainMessage = buildPlainMessage(recipe);

  const handleWhatsApp = useCallback(() => {
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
    setIsOpen(false);
  }, [message]);

  const handleSMS = useCallback(() => {
    const encoded = encodeURIComponent(plainMessage);
    // SMS deep link works on both iOS and Android
    window.open(`sms:?body=${encoded}`, "_blank");
    setIsOpen(false);
  }, [plainMessage]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Recipe: ${recipe.name}`,
          text: plainMessage,
        });
      } catch {
        // User cancelled or not supported
      }
    }
    setIsOpen(false);
  }, [recipe.name, plainMessage]);

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

  const handleSpeak = useCallback(() => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const text = `Recipe: ${recipe.name}. ${recipe.description}. Time: ${recipe.time}. Steps: ${recipe.steps?.map((s, i) => `Step ${i + 1}: ${s}`).join(". ")}`;
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
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl bg-surface border border-border shadow-xl overflow-hidden"
            >
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-left hover:bg-surface-hover transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-green-400" />
                  <div>
                    <span className="text-xs font-medium text-foreground/80 block">WhatsApp</span>
                    <span className="text-[10px] text-foreground/30">Send formatted recipe</span>
                  </div>
                </button>

                <button
                  onClick={handleSMS}
                  className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-left hover:bg-surface-hover transition-colors"
                >
                  <Send className="h-4 w-4 text-blue-400" />
                  <div>
                    <span className="text-xs font-medium text-foreground/80 block">SMS / iMessage</span>
                    <span className="text-[10px] text-foreground/30">Send as text message</span>
                  </div>
                </button>

                {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                  <button
                    onClick={handleNativeShare}
                    className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-left hover:bg-surface-hover transition-colors"
                  >
                    <Share2 className="h-4 w-4 text-orange" />
                    <div>
                      <span className="text-xs font-medium text-foreground/80 block">Share via...</span>
                      <span className="text-[10px] text-foreground/30">Any app on your phone</span>
                    </div>
                  </button>
                )}

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
                      {isSpeaking ? "Stop Reading" : "Read Aloud"}
                    </span>
                    <span className="text-[10px] text-foreground/30">
                      {isSpeaking ? "Stop voice" : "AI voice reads recipe"}
                    </span>
                  </div>
                </button>

                <div className="border-t border-border my-1" />

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
                    <span className="text-[10px] text-foreground/30">Copy to clipboard</span>
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
