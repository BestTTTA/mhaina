import { FishingPin, FishermanProfile } from './types';

const TEMPLATE_W = 768;
const TEMPLATE_H = 1376;
const TEMPLATE_SRC = '/template/share-image.png';
const LOGO_SRC = '/android-chrome-192x192.png';

const FONT_STACK = '"Noto Sans Thai", "IBM Plex Sans Thai", sans-serif';

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

// Cover-crop into a rectangle (sharp corners, no clipping path).
function drawCoverRect(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
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
}

function drawAvatarCircle(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  fallbackInitial: string,
  cx: number,
  cy: number,
  radius: number
) {
  // Outer glow halo
  ctx.save();
  ctx.shadowColor = 'rgba(255, 68, 68, 0.9)';
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.stroke();
  ctx.restore();

  // Image / placeholder clipped to circle
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
    const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    grad.addColorStop(0, '#1E1E1E');
    grad.addColorStop(1, '#2A2A2A');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(radius * 1.1)}px ${FONT_STACK}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fallbackInitial, cx, cy);
  }
  ctx.restore();
}

interface GradientTextOptions {
  font: string;
  colors: string[];
  glowColor?: string;
  glowBlur?: number;
  strokeColor?: string;
  strokeWidth?: number;
  align?: CanvasTextAlign;
}

function drawGradientText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  opts: GradientTextOptions
) {
  ctx.save();
  ctx.font = opts.font;
  ctx.textAlign = opts.align ?? 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  const metrics = ctx.measureText(text);
  const w = Math.max(metrics.width, 1);
  let gradStartX: number;
  let gradEndX: number;
  if (ctx.textAlign === 'left') {
    gradStartX = cx;
    gradEndX = cx + w;
  } else if (ctx.textAlign === 'right') {
    gradStartX = cx - w;
    gradEndX = cx;
  } else {
    gradStartX = cx - w / 2;
    gradEndX = cx + w / 2;
  }

  const grad = ctx.createLinearGradient(gradStartX, cy, gradEndX, cy);
  const stops = opts.colors;
  if (stops.length === 1) {
    grad.addColorStop(0, stops[0]);
    grad.addColorStop(1, stops[0]);
  } else {
    stops.forEach((c, i) => grad.addColorStop(i / (stops.length - 1), c));
  }

  // Outline first so the gradient fill stays crisp.
  if (opts.strokeColor) {
    ctx.lineWidth = opts.strokeWidth ?? 8;
    ctx.strokeStyle = opts.strokeColor;
    ctx.strokeText(text, cx, cy);
  }

  // Glow on the fill pass.
  if (opts.glowColor) {
    ctx.shadowColor = opts.glowColor;
    ctx.shadowBlur = opts.glowBlur ?? 28;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
  ctx.fillStyle = grad;
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

// Bigger photo card: sharp corners, multi-layered neon glow behind, no border.
function drawPhotoCard(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  cx: number,
  cy: number,
  w: number,
  h: number,
  rotateRad: number,
  glowColors: string[],
  fallbackLabel: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotateRad);

  // Layered glow: draw a filled rectangle with each color/blur, large→small.
  // Each pass adds a softer outer halo, and they stack into a vivid neon edge.
  const passes: { color: string; blur: number; alpha: number }[] = glowColors.map(
    (color, i) => ({
      color,
      blur: 70 - i * 14,
      alpha: 0.55,
    })
  );

  for (const p of passes) {
    ctx.save();
    ctx.shadowColor = p.color;
    ctx.shadowBlur = p.blur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = '#000000';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }

  // Solid black backdrop so the image sits cleanly above the glows.
  ctx.fillStyle = '#000000';
  ctx.fillRect(-w / 2, -h / 2, w, h);

  if (img) {
    drawCoverRect(ctx, img, -w / 2, -h / 2, w, h);
  } else {
    ctx.fillStyle = '#1E1E1E';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 32px ${FONT_STACK}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fallbackLabel, 0, 0);
  }

  ctx.restore();
}

function drawBrandFooter(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null
) {
  const cy = 1300;
  const logoSize = 76;
  const gap = 14;
  const text = 'หมายน้า.com';
  const font = `bold 50px ${FONT_STACK}`;

  // Measure text once with our chosen font.
  ctx.save();
  ctx.font = font;
  const textW = ctx.measureText(text).width;
  ctx.restore();

  const totalW = logoSize + gap + textW;
  const startX = (TEMPLATE_W - totalW) / 2;
  const logoCx = startX + logoSize / 2;
  const textStartX = startX + logoSize + gap;

  // Logo halo + circle clip
  if (logo) {
    ctx.save();
    ctx.shadowColor = 'rgba(255, 68, 68, 0.85)';
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(logoCx, cy, logoSize / 2 + 1, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(logoCx, cy, logoSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logo, logoCx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize);
    ctx.restore();
  }

  drawGradientText(ctx, text, textStartX, cy, {
    font,
    colors: ['#FF4444', '#FBBF24', '#60A5FA'],
    glowColor: 'rgba(251, 191, 36, 0.7)',
    glowBlur: 24,
    strokeColor: 'rgba(0, 0, 0, 0.85)',
    strokeWidth: 7,
    align: 'left',
  });
}

export async function generateShareImage(opts: ShareImageOptions): Promise<Blob> {
  const { pin, profile, rank } = opts;

  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Non-fatal.
    }
  }

  const [template, avatarImg, img1, img2, logoImg] = await Promise.all([
    loadImage(TEMPLATE_SRC, false),
    profile.avatar_url ? loadImage(profile.avatar_url, true).catch(() => null) : Promise.resolve(null),
    pin.image_url_1 ? loadImage(pin.image_url_1, true).catch(() => null) : Promise.resolve(null),
    pin.image_url_2 ? loadImage(pin.image_url_2, true).catch(() => null) : Promise.resolve(null),
    loadImage(LOGO_SRC, false).catch(() => null),
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

  // 2) Avatar — top center, with halo
  const avatarRadius = 70;
  const avatarCx = TEMPLATE_W / 2;
  const avatarCy = 130;
  const initial = (profile.nickname || '?').trim().charAt(0).toUpperCase() || '?';
  drawAvatarCircle(ctx, avatarImg, initial, avatarCx, avatarCy, avatarRadius);

  // 3) Username — vivid red→amber→blue gradient with glow
  drawGradientText(
    ctx,
    profile.nickname || 'นักตกปลา',
    TEMPLATE_W / 2,
    avatarCy + avatarRadius + 55,
    {
      font: `900 56px ${FONT_STACK}`,
      colors: ['#FF4444', '#FBBF24', '#60A5FA'],
      glowColor: 'rgba(251, 191, 36, 0.75)',
      glowBlur: 32,
      strokeColor: 'rgba(0, 0, 0, 0.85)',
      strokeWidth: 8,
    }
  );

  // 4) Ranking — green→cyan gradient with glow
  const rankText = rank && rank > 0 ? `อันดับที่ ${rank}` : 'นักตกปลาหมายน้า';
  drawGradientText(
    ctx,
    rankText,
    TEMPLATE_W / 2,
    avatarCy + avatarRadius + 130,
    {
      font: `900 46px ${FONT_STACK}`,
      colors: ['#22C55E', '#4ADE80', '#22D3EE'],
      glowColor: 'rgba(74, 222, 128, 0.7)',
      glowBlur: 28,
      strokeColor: 'rgba(0, 0, 0, 0.85)',
      strokeWidth: 7,
    }
  );

  // 5) Big photo cards — sharp corners, neon glow, no border
  const cardW = 380;
  const cardH = 520;
  const glowRedCyan = ['rgba(255, 68, 68, 0.9)', 'rgba(34, 211, 238, 0.7)'];
  const glowAmberBlue = ['rgba(251, 191, 36, 0.85)', 'rgba(59, 130, 246, 0.75)'];

  if (img1 && img2) {
    drawPhotoCard(ctx, img1, 230, 760, cardW, cardH, -0.11, glowRedCyan, 'รูปที่ 1');
    drawPhotoCard(ctx, img2, 530, 880, cardW, cardH, 0.09, glowAmberBlue, 'รูปที่ 2');
  } else if (img1 || img2) {
    drawPhotoCard(
      ctx,
      img1 ?? img2,
      TEMPLATE_W / 2,
      830,
      cardW + 20,
      cardH + 20,
      -0.04,
      glowRedCyan,
      'รูปที่ 1'
    );
  }

  // 6) Brand footer — logo + หมายน้า.com (drawn LAST so it sits on top)
  drawBrandFooter(ctx, logoImg);

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

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

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
      console.warn('[shareImage] navigator.share failed, falling back to download:', err);
    }
  }

  downloadBlob(blob, filename);
  return 'downloaded';
}
