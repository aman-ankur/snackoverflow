import type { MealPhotoRef } from "@/lib/dishTypes";

export async function makeMealThumbnail(dataUrl: string, id: string): Promise<{ ref: MealPhotoRef; blob: Blob }> {
  const image = new Image();
  image.src = dataUrl;
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Invalid photo")); });
  const scale = Math.min(320 / Math.max(image.width, image.height), 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d"); if (!context) throw new Error("Canvas unavailable");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  let blob = await canvasToBlob(canvas, 0.72);
  if (blob.size > 100_000) blob = await canvasToBlob(canvas, 0.5);
  if (blob.size > 100_000) throw new Error("Thumbnail exceeds size limit");
  return { blob, ref: { id, mimeType: "image/jpeg", width: canvas.width, height: canvas.height, byteSize: blob.size } };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not encode photo")), "image/jpeg", quality));
}
