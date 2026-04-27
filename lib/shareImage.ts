import { FishingPin, FishermanProfile } from './types';

const TEMPLATE_W = 768;
const TEMPLATE_H = 1376;
const TEMPLATE_SRC = '/template/share-image.png';

interface ShareImageOptions {
  pin: FishingPin;
  profile: Pick<FishermanProfile, 'nickname' | 'avatar_url'>;
  rank?: number | null;
}

function loadImage(src: string, useCors = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    if (useCors) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load image: ${src}`));
    img.src = src;
  });
}

function pathRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Draw an image into a rounded rect, cover-cropped (no distortion).
function drawCoverRounded(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  border?: { color: string; width: number }
) {
  ctx.save();
  pathRoundedRect(ctx, x, y, w, h, r);
  ctx.clip();

  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;
  if (imgRatio > boxRatio) {
    sw = img.height * boxRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / boxRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();

  if (border) {
    ctx.save();
    pathRoundedRect(ctx, x, y, w, h, r);
    ctx.lineWidth = border.width;
    ctx.strokeStyle = border.color;
    ctx.stroke();
    ctx.restore();
  }
}

function drawAvatarCircle(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  fallbackInitial: string,
  cx: number,
  cy: number,
  radius: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (img) {
    const size = radius * 2;
    const ratio = img.width / img.height;
    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;
    if (ratio > 1) {
      sw = img.height;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, cx - radius, cy - radius, size, size);
  } else {
    ctx.fillStyle = '#2A2A2A';
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(radius * 1.1)}px "Noto Sans Thai", "IBM Plex Sans Thai", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fallbackInitial, cx, cy);
  }
  ctx.restore();

  // Outer ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#FF4444';
  ctx.stroke();
  ctx.restore();
}

function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  font: string,
  fillStyle: string,
  options?: { stroke?: { color: string; width: number }; shadow?: string }
) {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (options?.shadow) {
    ctx.shadowColor = options.shadow;
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
  }
  if (options?.stroke) {
    ctx.lineWidth = options.stroke.width;
    ctx.strokeStyle = options.stroke.color;
    ctx.strokeText(text, cx, cy);
  }
  ctx.fillStyle = fillStyle;
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

export async function generateShareImage(opts: ShareImageOptions): Promise<Blob> {
  const { pin, profile, rank } = opts;

  // Wait for fonts so canvas renders Thai with the right family.
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Non-fatal; canvas falls back to system sans.
    }
  }

  const [template, avatarImg, img1, img2] = await Promise.all([
    loadImage(TEMPLATE_SRC, false),
    profile.avatar_url ? loadImage(profile.avatar_url, true).catch(() => null) : Promise.resolve(null),
    pin.image_url_1 ? loadImage(pin.image_url_1, true).catch(() => null) : Promise.resolve(null),
    pin.image_url_2 ? loadImage(pin.image_url_2, true).catch(() => null) : Promise.resolve(null),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = TEMPLATE_W;
  canvas.height = TEMPLATE_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1) Background template
  ctx.drawImage(template, 0, 0, TEMPLATE_W, TEMPLATE_H);

  // 2) Profile circle (top-center)
  const avatarRadius = 70;
  const avatarCx = TEMPLATE_W / 2;
  const avatarCy = 140;
  const initial = (profile.nickname || '?').trim().charAt(0).toUpperCase() || '?';
  drawAvatarCircle(ctx, avatarImg, initial, avatarCx, avatarCy, avatarRadius);

  // 3) Username — blue
  drawCenteredText(
    ctx,
    profile.nickname || 'นักตกปลา',
    TEMPLATE_W / 2,
    avatarCy + avatarRadius + 50,
    'bold 46px "Noto Sans Thai", "IBM Plex Sans Thai", sans-serif',
    '#3B82F6',
    {
      stroke: { color: '#0B1530', width: 6 },
      shadow: 'rgba(0,0,0,0.55)',
    }
  );

  // 4) Ranking — green
  const rankText = rank && rank > 0 ? `อันดับที่ ${rank}` : 'นักตกปลาหมายน้า';
  drawCenteredText(
    ctx,
    rankText,
    TEMPLATE_W / 2,
    avatarCy + avatarRadius + 115,
    'bold 40px "Noto Sans Thai", "IBM Plex Sans Thai", sans-serif',
    '#22C55E',
    {
      stroke: { color: '#0B2410', width: 6 },
      shadow: 'rgba(0,0,0,0.55)',
    }
  );

  // 5) Two tilted catch photos in the middle
  const cardW = 290;
  const cardH = 410;
  const radius = 26;

  const drawCard = (
    img: HTMLImageElement | null,
    cx: number,
    cy: number,
    rotateRad: number,
    fallbackLabel: string
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotateRad);
    // Drop shadow
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
    if (img) {
      drawCoverRounded(ctx, img, -cardW / 2, -cardH / 2, cardW, cardH, radius, {
        color: '#FF4444',
        width: 6,
      });
    } else {
      // Fallback: red rounded rect with a label
      ctx.fillStyle = '#FF4444';
      pathRoundedRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, radius);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px "Noto Sans Thai", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fallbackLabel, 0, 0);
    }
    ctx.restore();
  };

  // Two-card overlapping layout when both images exist; otherwise center the
  // single available image so the bottom doesn't look lopsided.
  if (img1 && img2) {
    drawCard(img1, 240, 760, -0.13, 'รูปที่ 1');
    drawCard(img2, 510, 870, 0.1, 'รูปที่ 2');
  } else if (img1 || img2) {
    drawCard(img1 ?? img2, TEMPLATE_W / 2, 820, -0.05, 'รูปที่ 1');
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      },
      'image/png',
      0.95
    );
  });
}

function safeFilename(s: string): string {
  return (s || 'mhaina').replace(/[^a-zA-Z0-9ก-๙_-]+/g, '_').slice(0, 40);
}

export function buildShareFilename(pin: FishingPin): string {
  const species = safeFilename(pin.fish_species);
  const id = pin.id.slice(0, 8);
  return `mhaina-${species}-${id}.png`;
}

// Trigger a browser download for the given blob.
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke after a tick so the click has time to register the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Use Web Share API when the browser supports sharing files; otherwise fall
// back to a regular download. Returns 'shared' | 'downloaded' | 'cancelled'.
export async function shareOrDownload(
  blob: Blob,
  filename: string,
  meta: { title?: string; text?: string }
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], filename, { type: 'image/png' });
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };

  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: meta.title, text: meta.text });
      return 'shared';
    } catch (err: any) {
      if (err?.name === 'AbortError') return 'cancelled';
      // Fall through to download on share failure.
      console.warn('[shareImage] navigator.share failed, falling back to download:', err);
    }
  }

  downloadBlob(blob, filename);
  return 'downloaded';
}
