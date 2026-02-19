"use client";

import { useState } from "react";
import { Key, Eye, EyeOff, ExternalLink } from "lucide-react";

interface ApiKeyInputProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export default function ApiKeyInput({
  apiKey,
  onApiKeyChange,
}: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="rounded-2xl bg-surface border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Key className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold">Gemini API Key</h2>
        {apiKey && (
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent ml-auto">
            Connected
          </span>
        )}
      </div>
      <div className="p-3 space-y-2">
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="Paste your Gemini API key..."
            className="w-full rounded-xl bg-background border border-border px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors"
          >
            {showKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-foreground/25">
            Free tier: 15 requests/min • Key stays in your browser
          </p>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-accent/60 hover:text-accent transition-colors"
          >
            Get free key
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
