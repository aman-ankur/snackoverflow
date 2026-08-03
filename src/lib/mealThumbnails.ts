"use client";

import type { MealPhotoRef } from "@/lib/dishTypes";

const DB_NAME = "snackoverflow-meal-photos";
const STORE = "meal-thumbnails";
const DB_VERSION = 1;

export interface StoredMealThumbnail extends MealPhotoRef {
  mealId: string;
  ownerId: string;
  blob: Blob;
  syncState: "local" | "synced" | "pending-delete";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putMealThumbnail(value: StoredMealThumbnail): Promise<void> {
  if (typeof indexedDB === "undefined") throw new Error("IndexedDB unavailable");
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(value);
    request.onsuccess = () => resolve(); request.onerror = () => reject(request.error);
  });
  db.close();
}

export async function getMealThumbnail(id: string): Promise<StoredMealThumbnail | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDb();
  const result = await new Promise<StoredMealThumbnail | null>((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
    request.onsuccess = () => resolve((request.result as StoredMealThumbnail) || null); request.onerror = () => reject(request.error);
  });
  db.close(); return result;
}

export async function deleteMealThumbnail(id: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).delete(id);
    request.onsuccess = () => resolve(); request.onerror = () => reject(request.error);
  });
  db.close();
}

export async function listMealThumbnails(): Promise<StoredMealThumbnail[]> {
  if (typeof indexedDB === "undefined") return [];
  const db = await openDb();
  const result = await new Promise<StoredMealThumbnail[]>((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result as StoredMealThumbnail[]); request.onerror = () => reject(request.error);
  });
  db.close(); return result;
}

export async function clearMealThumbnails(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => { const request = db.transaction(STORE, "readwrite").objectStore(STORE).clear(); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); });
  db.close();
}

export function installationOwnerId(): string {
  const key = "snackoverflow-installation-owner";
  let value = localStorage.getItem(key);
  if (!value) { value = `guest-${crypto.randomUUID()}`; localStorage.setItem(key, value); }
  return value;
}
