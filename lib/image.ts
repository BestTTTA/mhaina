// Client-side image -> WebP conversion.
// Falls back to the original file if the browser can't decode it (e.g. HEIC in Chrome).

export interface ConvertOptions {
  maxSize?: number;
  quality?: number;
}

export async function convertToWebP(
  file: File,
  { maxSize = 1600, quality = 0.85 }: ConvertOptions = {}
): Promise<File> {
  if (file.type === 'image/webp') return file;
  if (typeof window === 'undefined') return file;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const blob = await drawToWebP(bitmap, width, height, quality);
    bitmap.close?.();
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
  } catch (err) {
    console.warn('WebP conversion failed, uploading original:', err);
    return file;
  }
}

async function drawToWebP(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  quality: number
): Promise<Blob | null> {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas.convertToBlob({ type: 'image/webp', quality });
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
}
