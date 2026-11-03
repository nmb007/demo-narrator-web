"use client";

import { animate, useAnimationFrame, useMotionValue } from "motion/react";
import { useEffect, useRef } from "react";

const VIEW_W = 520;
const VIEW_H = 340;
const SCAN_MS = 5500;
const LIT_HOLD_MS = 1400;
const WAVE_Y = 228;
const WAVE_LEFT = 40;
const WAVE_RIGHT = 480;
const FRAME_INSET = 16;
const FRAME_BOTTOM = 284;
const SCAN_EASE = [0.4, 0, 0.2, 1] as const;

type Particle = {
  x: number;
  strand: number;
  scatter: number;
  size: number;
  alpha: number;
};

function hash(i: number, j: number) {
  const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function envelope(xNorm: number) {
  return Math.sin(xNorm * Math.PI) ** 0.92;
}

function noisyAmp(xNorm: number, phase: number, strand: number) {
  const off = strand * 0.16;
  return (
    (16 * Math.sin(xNorm * Math.PI * 2.1 + phase + off) +
      10 * Math.sin(xNorm * Math.PI * 3.9 - phase * 0.9 + off) +
      6.5 * Math.sin(xNorm * Math.PI * 6.6 + phase * 0.5) +
      3.4 * Math.sin(xNorm * Math.PI * 10.2 - phase * 1.15)) *
    envelope(xNorm)
  );
}

function smoothAmp(xNorm: number, phase: number, strand: number) {
  const off = strand * 0.09;
  return (
    (11 * Math.sin(xNorm * Math.PI * 2 + phase * 0.35 + off) +
      2.2 * Math.sin(xNorm * Math.PI * 4 + off * 1.4)) *
    envelope(xNorm)
  );
}

function buildField(kind: "noisy" | "smooth"): Particle[] {
  const strands = kind === "noisy" ? 13 : 6;
  const cols = kind === "noisy" ? 78 : 88;
  const mid = (strands - 1) / 2;
  const particles: Particle[] = [];
  for (let s = 0; s < strands; s++) {
    const dist = mid === 0 ? 0 : Math.abs(s - mid) / mid;
    for (let c = 0; c < cols; c++) {
      const xNorm =
        kind === "noisy"
          ? (c + 0.35 + hash(c, s) * 0.3) / cols
          : (c + 0.2 + hash(c, s) * 0.6) / cols;
      particles.push({
        x: WAVE_LEFT + xNorm * (WAVE_RIGHT - WAVE_LEFT),
        strand: s - mid,
        scatter:
          kind === "noisy"
            ? (hash(c, s + 3) - 0.5) * 5.8
            : (hash(c, s + 3) - 0.5) * 1.7,
        size:
          kind === "noisy"
            ? 0.85 + hash(c, s + 5) * 1.45 + (dist < 0.2 ? 0.35 : 0)
            : 0.38 + hash(c, s + 5) * 0.55 + (dist < 0.35 ? 0.18 : 0),
        alpha:
          kind === "noisy"
            ? 0.22 + (1 - dist) * 0.5 + hash(c, s + 9) * 0.18
            : 0.28 + (1 - dist) * 0.4 + hash(c, s + 9) * 0.22,
      });
    }
  }
  return particles;
}

const NOISY_FIELD = buildField("noisy");
const SMOOTH_FIELD = buildField("smooth");

const FRAME_WIDTH = 88;
const FRAME_GAP = 18;
const STAGE_X = 40;
const STAGE_W = 440;
const FRAMES_TOTAL = 4 * FRAME_WIDTH + 3 * FRAME_GAP;
const FRAME_PAD = (STAGE_W - FRAMES_TOTAL) / 2;
const FRAME_CENTERS = [0, 1, 2, 3].map(
  (i) => STAGE_X + FRAME_PAD + FRAME_WIDTH / 2 + i * (FRAME_WIDTH + FRAME_GAP),
);

function cssVar(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value.length > 0 ? value : fallback;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function mixLit(dim: number, bright: number, lit: number) {
  return dim + (bright - dim) * lit;
}

function drawChrome(
  ctx: CanvasRenderingContext2D,
  sand: string,
  paper: string,
  copper: string,
  bay: string,
  lit: number,
) {
  ctx.save();
  ctx.strokeStyle = sand;
  ctx.globalAlpha = mixLit(0.35, 0.52, lit);
  ctx.lineWidth = 1.25;
  roundRect(ctx, FRAME_INSET, FRAME_INSET, 488, 268, 12);
  ctx.stroke();
  ctx.fillStyle = sand;
  ctx.globalAlpha = mixLit(0.06, 0.11, lit);
  ctx.fill();

  ctx.globalAlpha = mixLit(0.1, 0.16, lit);
  roundRect(ctx, FRAME_INSET, FRAME_INSET, 488, 28, 12);
  ctx.fill();
  ctx.fillRect(FRAME_INSET, 36, 488, 8);

  ctx.globalAlpha = mixLit(0.45, 0.55, lit);
  ctx.beginPath();
  ctx.arc(36, 30, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = mixLit(0.3, 0.4, lit);
  ctx.beginPath();
  ctx.arc(50, 30, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = mixLit(0.2, 0.32, lit);
  ctx.beginPath();
  ctx.arc(64, 30, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = mixLit(0.45, 0.58, lit);
  roundRect(ctx, 86, 27, 72, 6, 3);
  ctx.fill();

  ctx.globalAlpha = mixLit(0.06, 0.14, lit);
  roundRect(ctx, STAGE_X, 56, STAGE_W, 124, 8);
  ctx.fill();

  for (const cx of FRAME_CENTERS) {
    ctx.fillStyle = sand;
    ctx.globalAlpha = mixLit(0.16, 0.38, lit);
    roundRect(ctx, cx - FRAME_WIDTH / 2, 70, FRAME_WIDTH, 64, 5);
    ctx.fill();
    ctx.globalAlpha = mixLit(0.12, 0.28, lit);
    roundRect(ctx, cx - FRAME_WIDTH / 2 + 8, 80, FRAME_WIDTH - 16, 20, 3);
    ctx.fill();
    ctx.globalAlpha = mixLit(0.32, 0.62, lit);
    roundRect(ctx, cx - 26, 108, 48, 6, 3);
    ctx.fill();
    ctx.globalAlpha = mixLit(0.2, 0.48, lit);
    roundRect(ctx, cx - 26, 120, 32, 5, 2.5);
    ctx.fill();
  }

  if (lit > 0.02) {
    ctx.fillStyle = copper;
    ctx.globalAlpha = lit * 0.12;
    ctx.beginPath();
    ctx.arc(260, 118, 28, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = lit > 0.35 ? paper : sand;
  ctx.globalAlpha = mixLit(0.5, 0.92, lit);
  ctx.beginPath();
  ctx.arc(260, 118, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = lit > 0.35 ? bay : sand;
  ctx.globalAlpha = mixLit(0.9, 1, lit);
  ctx.beginPath();
  ctx.moveTo(254, 110);
  ctx.lineTo(269, 118);
  ctx.lineTo(254, 126);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawField(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  kind: "noisy" | "smooth",
  phase: number,
  color: string,
  glow: string,
) {
  const ampFn = kind === "noisy" ? noisyAmp : smoothAmp;
  const yGap = kind === "noisy" ? 2.35 : 0.85;

  ctx.save();
  ctx.strokeStyle = glow;
  ctx.globalAlpha = kind === "noisy" ? 0.22 : 0.16;
  ctx.lineWidth = kind === "noisy" ? 10 : 2.1;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i <= 48; i++) {
    const xNorm = i / 48;
    const x = WAVE_LEFT + xNorm * (WAVE_RIGHT - WAVE_LEFT);
    const y = WAVE_Y + ampFn(xNorm, phase, 0);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.restore();

  for (const particle of particles) {
    const xNorm = (particle.x - WAVE_LEFT) / (WAVE_RIGHT - WAVE_LEFT);
    const y =
      WAVE_Y +
      ampFn(xNorm, phase, particle.strand) +
      particle.strand * yGap +
      particle.scatter;
    ctx.globalAlpha = particle.alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(particle.x, y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPlayhead(
  ctx: CanvasRenderingContext2D,
  x: number,
  copper: string,
  glow: string,
) {
  ctx.save();
  const gradient = ctx.createLinearGradient(x - 18, 0, x + 18, 0);
  gradient.addColorStop(0, "transparent");
  gradient.addColorStop(0.45, glow);
  gradient.addColorStop(0.5, glow);
  gradient.addColorStop(0.55, glow);
  gradient.addColorStop(1, "transparent");
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = gradient;
  ctx.fillRect(x - 18, FRAME_INSET, 36, FRAME_BOTTOM - FRAME_INSET);

  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = copper;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, FRAME_INSET);
  ctx.lineTo(x, FRAME_BOTTOM);
  ctx.stroke();

  ctx.fillStyle = copper;
  ctx.beginPath();
  ctx.arc(x, FRAME_BOTTOM, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = copper;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, FRAME_BOTTOM, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

type SignupConvertAnimationProps = {
  reduceMotion: boolean;
};

export function SignupConvertAnimation({
  reduceMotion,
}: SignupConvertAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const litRef = useRef(0);
  const scan = useMotionValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(canvas);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      scan.set(1);
      litRef.current = 1;
      return;
    }
    scan.set(0);
    litRef.current = 0;
    const controls = animate(scan, 1, {
      duration: SCAN_MS / 1000,
      ease: SCAN_EASE,
      repeat: Infinity,
      repeatDelay: LIT_HOLD_MS / 1000,
    });
    return () => {
      controls.stop();
    };
  }, [reduceMotion, scan]);

  useAnimationFrame((time) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const scaleX = canvas.width / VIEW_W;
    const scaleY = canvas.height / VIEW_H;
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);

    const sand = cssVar("--sand", "oklch(0.78 0.03 85)");
    const copper = cssVar("--copper", "oklch(0.62 0.12 55)");
    const paper = cssVar("--background", "oklch(0.962 0.008 85)");
    const bay = cssVar("--bay", "oklch(0.22 0.006 85)");
    const copperBright = "oklch(0.74 0.12 55)";
    const progress = scan.get();
    const scanX = FRAME_INSET + progress * 488;
    const phase = reduceMotion ? 0.8 : time / 1000;
    const litTarget = reduceMotion || progress >= 0.995 ? 1 : 0;
    litRef.current +=
      (litTarget - litRef.current) * (litTarget > litRef.current ? 0.14 : 0.28);
    const lit = litRef.current;

    drawChrome(ctx, sand, paper, copper, bay, lit);

    ctx.save();
    ctx.beginPath();
    ctx.rect(scanX, 0, VIEW_W - scanX, VIEW_H);
    ctx.clip();
    drawField(ctx, NOISY_FIELD, "noisy", phase * 1.35, copper, copperBright);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, scanX, VIEW_H);
    ctx.clip();
    drawField(ctx, SMOOTH_FIELD, "smooth", phase * 0.22, paper, paper);
    ctx.restore();

    drawPlayhead(ctx, scanX, copper, copperBright);
  });

  return (
    <div className="aspect-[520/340] w-full" aria-hidden>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
