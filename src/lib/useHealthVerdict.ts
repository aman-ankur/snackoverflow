"use client";

import { useState, useCallback, useRef } from "react";
import type { MealHealthAnalysis } from "@/lib/dishTypes";

interface DishInput {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  ingredients: string[];
  tags: string[];
}

type VerdictStatus = "idle" | "loading" | "success" | "error";

interface UseHealthVerdictReturn {
  verdict: MealHealthAnalysis | null;
  status: VerdictStatus;
  error: string | null;
  fetchVerdict: (dishes: DishInput[], healthContextString: string) => void;
  clearVerdict: () => void;
}

export function useHealthVerdict(): UseHealthVerdictReturn {
  const [verdict, setVerdict] = useState<MealHealthAnalysis | null>(null);
  const [status, setStatus] = useState<VerdictStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchVerdict = useCallback(
    (dishes: DishInput[], healthContextString: string) => {
      if (!healthContextString.trim() || dishes.length === 0) return;

      // Abort any in-flight request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus("loading");
      setError(null);
      setVerdict(null);

      fetch("/api/health-verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishes, healthContextString }),
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(
              (body as { error?: string }).error ?? `HTTP ${res.status}`
            );
          }
          return res.json();
        })
        .then((data: MealHealthAnalysis) => {
          if (controller.signal.aborted) return;
          setVerdict(data);
          setStatus("success");
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          const msg = err instanceof Error ? err.message : "Unknown error";
          setError(msg);
          setStatus("error");
        });
    },
    []
  );

  const clearVerdict = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setVerdict(null);
    setStatus("idle");
    setError(null);
  }, []);

  return { verdict, status, error, fetchVerdict, clearVerdict };
}
