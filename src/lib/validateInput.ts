/** Returns error message if invalid, null if OK */
export function validateBase64Image(
  image: unknown,
  maxBytes = 5_000_000,
): string | null {
  if (!image || typeof image !== "string") {
    return "Image data is required";
  }
  // Strip data URI prefix for size check
  const raw = image.replace(/^data:image\/\w+;base64,/, "");
  // Base64 encodes 3 bytes per 4 chars
  const estimatedBytes = Math.ceil((raw.length * 3) / 4);
  if (estimatedBytes > maxBytes) {
    return `Image too large (${(estimatedBytes / 1_000_000).toFixed(1)}MB). Max ${(maxBytes / 1_000_000).toFixed(1)}MB.`;
  }
  return null;
}

/** Returns error message if invalid, null if OK */
export function validateString(
  value: unknown,
  maxLength: number,
  fieldName: string,
): string | null {
  if (typeof value !== "string") return null; // let route handle required checks
  if (value.length > maxLength) {
    return `${fieldName} too long (${value.length} chars). Max ${maxLength}.`;
  }
  return null;
}

/** Returns error message if invalid, null if OK */
export function validateArray(
  value: unknown,
  maxItems: number,
  fieldName: string,
): string | null {
  if (!Array.isArray(value)) return null; // let route handle required checks
  if (value.length > maxItems) {
    return `${fieldName} has too many items (${value.length}). Max ${maxItems}.`;
  }
  return null;
}
