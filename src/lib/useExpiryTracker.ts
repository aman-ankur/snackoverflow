"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuthContext } from "@/components/AuthProvider";
import { pullUserData, pushUserData } from "@/lib/supabase/sync";

export interface TrackedItem {
  name: string;
  hindi?: string;
  addedAt: string; // ISO date
  expiresAt?: string; // ISO date
  category: "fresh" | "expiring" | "expired" | "unknown";
}

const STORAGE_KEY = "snackoverflow-expiry-tracker";

// Default shelf life estimates (days) for common Indian kitchen items
const SHELF_LIFE: Record<string, number> = {
  milk: 3,
  curd: 5,
  yogurt: 5,
  paneer: 5,
  bread: 4,
  egg: 14,
  eggs: 14,
  tomato: 5,
  onion: 14,
  potato: 21,
  banana: 4,
  apple: 10,
  orange: 10,
  lemon: 14,
  carrot: 10,
  capsicum: 5,
  "green chili": 7,
  ginger: 14,
  garlic: 21,
  spinach: 3,
  coriander: 3,
  "methi leaves": 3,
  cucumber: 5,
  broccoli: 5,
  cauliflower: 7,
  cabbage: 10,
  "bell pepper": 5,
  mushroom: 3,
  "spring onion": 4,
  butter: 14,
  cheese: 14,
  cream: 5,
  tofu: 5,
};

function getCategory(expiresAt?: string): TrackedItem["category"] {
  if (!expiresAt) return "unknown";
  const now = new Date();
  const exp = new Date(expiresAt);
  const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 2) return "expiring";
  return "fresh";
}

function getDaysLeft(expiresAt?: string): number | null {
  if (!expiresAt) return null;
  const now = new Date();
  const exp = new Date(expiresAt);
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function useExpiryTracker() {
  const [items, setItems] = useState<TrackedItem[]>([]);
  const { user, isLoggedIn } = useAuthContext();
  const hasPulledCloud = useRef(false);

  // Load from localStorage only after mount to keep server/client markup stable.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed: TrackedItem[] = JSON.parse(stored);
      const updated = parsed.map((item) => ({
        ...item,
        category: getCategory(item.expiresAt) as TrackedItem["category"],
      }));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(updated);
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Pull from Supabase when user logs in
  useEffect(() => {
    if (!isLoggedIn || !user || hasPulledCloud.current) return;
    hasPulledCloud.current = true;
    pullUserData(user.id).then((cloud) => {
      if (!cloud) return;
      const cloudItems = cloud.expiry_tracker;
      if (Array.isArray(cloudItems) && cloudItems.length > 0) {
        const updated = (cloudItems as TrackedItem[]).map((item) => ({
          ...item,
          category: getCategory(item.expiresAt) as TrackedItem["category"],
        }));
        setItems(updated);
      }
    }).catch(() => {});
  }, [isLoggedIn, user]);

  // Save to localStorage on change
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }

    // Sync to Supabase
    if (isLoggedIn && user) {
      pushUserData(user.id, "expiry_tracker", items);
    }
  }, [items, isLoggedIn, user]);

  const addItems = useCallback((newItems: { name: string; hindi?: string }[]) => {
    setItems((prev) => {
      const existing = new Set(prev.map((i) => i.name.toLowerCase()));
      const toAdd: TrackedItem[] = [];

      newItems.forEach(({ name, hindi }) => {
        if (existing.has(name.toLowerCase())) return;
        const shelfDays = SHELF_LIFE[name.toLowerCase()];
        const addedAt = new Date().toISOString();
        let expiresAt: string | undefined;

        if (shelfDays) {
          const exp = new Date();
          exp.setDate(exp.getDate() + shelfDays);
          expiresAt = exp.toISOString();
        }

        toAdd.push({
          name,
          hindi,
          addedAt,
          expiresAt,
          category: getCategory(expiresAt),
        });
      });

      return [...prev, ...toAdd];
    });
  }, []);

  const setExpiry = useCallback((itemName: string, expiresAt: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.name === itemName
          ? { ...item, expiresAt, category: getCategory(expiresAt) }
          : item
      )
    );
  }, []);

  const removeTrackedItem = useCallback((itemName: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.name !== itemName);
      if (updated.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      }
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const expiringItems = items.filter((i) => i.category === "expiring");
  const expiredItems = items.filter((i) => i.category === "expired");

  return {
    trackedItems: items,
    expiringItems,
    expiredItems,
    expiringCount: expiringItems.length + expiredItems.length,
    addItems,
    setExpiry,
    removeTrackedItem,
    clearAll,
    getDaysLeft,
  };
}
