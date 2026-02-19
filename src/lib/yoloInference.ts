import * as ort from "onnxruntime-web";
import { YOLO_LABELS } from "./yoloLabels";

export interface YoloDetection {
  label: string;
  classId: number;
  score: number;
  bbox: [number, number, number, number]; // [x, y, w, h] in pixel coords
}

const MODEL_WIDTH = 640;
const MODEL_HEIGHT = 640;
const SCORE_THRESHOLD = 0.35;
const IOU_THRESHOLD = 0.45;

let session: ort.InferenceSession | null = null;
let loading = false;

export async function loadYoloModel(): Promise<void> {
  if (session || loading) return;
  loading = true;

  try {
    // Configure ONNX Runtime to use WASM backend from local public dir
    ort.env.wasm.wasmPaths = "/";
    ort.env.wasm.numThreads = 1;

    session = await ort.InferenceSession.create("/model/yolov8n.onnx", {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
    console.log("[YOLO] Model loaded successfully");
  } catch (err) {
    console.error("[YOLO] Failed to load model:", err);
    throw err;
  } finally {
    loading = false;
  }
}

export function isYoloLoaded(): boolean {
  return session !== null;
}

// Preprocess: resize image to 640x640, normalize to [0,1], convert to NCHW tensor
function preprocess(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement
): [ort.Tensor, number, number, number] {
  const ctx = canvas.getContext("2d")!;
  canvas.width = MODEL_WIDTH;
  canvas.height = MODEL_HEIGHT;

  // Calculate letterbox scaling
  const scale = Math.min(
    MODEL_WIDTH / video.videoWidth,
    MODEL_HEIGHT / video.videoHeight
  );
  const scaledW = Math.round(video.videoWidth * scale);
  const scaledH = Math.round(video.videoHeight * scale);
  const padX = (MODEL_WIDTH - scaledW) / 2;
  const padY = (MODEL_HEIGHT - scaledH) / 2;

  // Fill with gray (letterbox padding)
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, MODEL_WIDTH, MODEL_HEIGHT);

  // Draw scaled video frame
  ctx.drawImage(video, padX, padY, scaledW, scaledH);

  const imageData = ctx.getImageData(0, 0, MODEL_WIDTH, MODEL_HEIGHT);
  const pixels = imageData.data;

  // Convert to Float32 NCHW format [1, 3, 640, 640]
  const totalPixels = MODEL_WIDTH * MODEL_HEIGHT;
  const float32Data = new Float32Array(3 * totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    float32Data[i] = pixels[i * 4] / 255.0; // R
    float32Data[totalPixels + i] = pixels[i * 4 + 1] / 255.0; // G
    float32Data[2 * totalPixels + i] = pixels[i * 4 + 2] / 255.0; // B
  }

  const tensor = new ort.Tensor("float32", float32Data, [1, 3, MODEL_HEIGHT, MODEL_WIDTH]);
  return [tensor, scale, padX, padY];
}

// Non-Maximum Suppression
function nms(detections: YoloDetection[]): YoloDetection[] {
  detections.sort((a, b) => b.score - a.score);
  const result: YoloDetection[] = [];

  while (detections.length > 0) {
    const best = detections.shift()!;
    result.push(best);

    detections = detections.filter((det) => {
      if (det.classId !== best.classId) return true;
      return iou(best.bbox, det.bbox) < IOU_THRESHOLD;
    });
  }

  return result;
}

function iou(
  a: [number, number, number, number],
  b: [number, number, number, number]
): number {
  const ax1 = a[0],
    ay1 = a[1],
    ax2 = a[0] + a[2],
    ay2 = a[1] + a[3];
  const bx1 = b[0],
    by1 = b[1],
    bx2 = b[0] + b[2],
    by2 = b[1] + b[3];

  const interX1 = Math.max(ax1, bx1);
  const interY1 = Math.max(ay1, by1);
  const interX2 = Math.min(ax2, bx2);
  const interY2 = Math.min(ay2, by2);

  const interArea = Math.max(0, interX2 - interX1) * Math.max(0, interY2 - interY1);
  const unionArea = a[2] * a[3] + b[2] * b[3] - interArea;

  return unionArea > 0 ? interArea / unionArea : 0;
}

// Run inference on a video frame
export async function detectFrame(
  video: HTMLVideoElement,
  preprocessCanvas: HTMLCanvasElement
): Promise<YoloDetection[]> {
  if (!session) throw new Error("Model not loaded");

  const [inputTensor, scale, padX, padY] = preprocess(preprocessCanvas, video);

  // Run inference
  const feeds: Record<string, ort.Tensor> = { images: inputTensor };
  const results = await session.run(feeds);

  // YOLOv8 output shape: [1, 84, 8400] — 84 = 4 bbox + 80 classes, 8400 predictions
  const output = results[Object.keys(results)[0]];
  const data = output.data as Float32Array;
  const [, numFields, numPredictions] = output.dims as number[];

  const detections: YoloDetection[] = [];

  for (let i = 0; i < numPredictions; i++) {
    // Extract bbox (center_x, center_y, width, height)
    const cx = data[0 * numPredictions + i];
    const cy = data[1 * numPredictions + i];
    const w = data[2 * numPredictions + i];
    const h = data[3 * numPredictions + i];

    // Find best class
    let maxScore = 0;
    let maxClassId = 0;
    for (let c = 4; c < numFields; c++) {
      const score = data[c * numPredictions + i];
      if (score > maxScore) {
        maxScore = score;
        maxClassId = c - 4;
      }
    }

    if (maxScore < SCORE_THRESHOLD) continue;

    // Convert from model coords back to original video coords
    const x1 = (cx - w / 2 - padX) / scale;
    const y1 = (cy - h / 2 - padY) / scale;
    const bw = w / scale;
    const bh = h / scale;

    detections.push({
      label: YOLO_LABELS[maxClassId] || `class_${maxClassId}`,
      classId: maxClassId,
      score: maxScore,
      bbox: [x1, y1, bw, bh],
    });
  }

  return nms(detections);
}
