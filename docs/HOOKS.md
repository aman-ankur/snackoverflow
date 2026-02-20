# Custom React Hooks

All hooks are in `src/lib/`. All are `"use client"`.

---

## `useGeminiVision()` — Main Cloud AI Hook

**File**: `src/lib/useGeminiVision.ts`

### Exported Types
```ts
interface DetectedItem {
  name: string;
  hindi: string;
  quantity: string;
  confidence: "high" | "medium" | "low";
}

type DietaryFilter = "all" | "vegetarian" | "vegan" | "eggetarian" | "jain";

interface GeminiRecipe {
  name: string;
  hindi: string;
  time: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  ingredients_used: string[];
  ingredients_needed: string[];
  steps: string[];
  tags: string[];
  diet?: string;
}

interface AnalysisResult {
  items: DetectedItem[];
  recipes: GeminiRecipe[];
  tip: string;
}
```

### State
| State | Type | Description |
|---|---|---|
| `isStreaming` | boolean | Camera is active |
| `isAnalyzing` | boolean | API call in progress |
| `error` | string \| null | Current error message |
| `analysis` | AnalysisResult \| null | Latest analysis result |
| `allItems` | DetectedItem[] | Accumulated items across all scans (deduped, removed items filtered) |
| `lastAnalyzedAt` | Date \| null | Timestamp of last successful analysis |
| `autoScan` | boolean | Auto-scan mode active (every 4s) |
| `frameCount` | number | Number of successful scans |
| `dietaryFilter` | DietaryFilter | Current diet preference |
| `facingMode` | "user" \| "environment" | Camera direction (default: environment/rear) |

### Refs
- `videoRef` — HTMLVideoElement for camera feed
- `canvasRef` — HTMLCanvasElement for overlay
- `captureCanvasRef` — offscreen canvas for frame capture (512px max width, JPEG 0.6 quality)
- `streamRef` — MediaStream
- `intervalRef` — auto-scan interval

### Methods
| Method | Description |
|---|---|
| `startCamera()` | Request camera access, start streaming |
| `stopCamera()` | Stop all tracks, clear interval, reset state |
| `flipCamera()` | Toggle front/rear camera |
| `analyzeFrame()` | Capture frame → POST /api/analyze → update state |
| `toggleAutoScan()` | Start/stop 4-second auto-analysis interval |
| `removeItem(name)` | Remove item from accumulated list |
| `clearAnalysis()` | Reset all analysis state |
| `setDietaryFilter(f)` | Change dietary filter |

### Key Behaviors
- Frame capture downscales to max 512px wide (reduces API token usage)
- Items accumulate across scans — deduplication by lowercase name, keeps highest confidence
- On 429 rate limit, auto-scan is stopped automatically
- Camera restarts when facingMode changes (if already streaming)

---

## `useExpiryTracker()` — Freshness Tracking Hook

**File**: `src/lib/useExpiryTracker.ts`

### Exported Types
```ts
interface TrackedItem {
  name: string;
  hindi?: string;
  addedAt: string;    // ISO date
  expiresAt?: string; // ISO date
  category: "fresh" | "expiring" | "expired" | "unknown";
}
```

### localStorage Key
`fridgenius-expiry-tracker`

### Built-in Shelf Life Estimates
Common Indian kitchen items with default days:
- milk: 3, curd: 5, paneer: 5, bread: 4, egg: 14
- tomato: 5, onion: 14, potato: 21, banana: 4
- spinach: 3, coriander: 3, mushroom: 3
- butter: 14, cheese: 14, cream: 5
- (30+ items total)

### State & Methods
| Return | Type | Description |
|---|---|---|
| `trackedItems` | TrackedItem[] | All tracked items |
| `expiringItems` | TrackedItem[] | Items with category "expiring" |
| `expiredItems` | TrackedItem[] | Items with category "expired" |
| `expiringCount` | number | Count of expiring + expired |
| `addItems(items)` | function | Add new items (skips duplicates, auto-estimates expiry) |
| `setExpiry(name, date)` | function | Manually set expiry date |
| `removeTrackedItem(name)` | function | Remove single item |
| `clearAll()` | function | Remove all items |
| `getDaysLeft(expiresAt)` | function | Calculate days until expiry |

### Category Logic
- `expired`: daysLeft < 0
- `expiring`: daysLeft ≤ 2
- `fresh`: daysLeft > 2
- `unknown`: no expiresAt set

---

## `useYoloDetection()` — YOLO On-Device Hook

**File**: `src/lib/useYoloDetection.ts`

Manages ONNX Runtime Web inference with YOLOv8n model. Handles model loading, camera stream, real-time inference loop, and bounding box drawing on canvas.

Not actively developed — YOLO mode is experimental.

---

## `useDetection()` — Legacy Detection Hook

**File**: `src/lib/useDetection.ts`

Legacy hook, not actively used. Was for TensorFlow.js COCO-SSD detection.
