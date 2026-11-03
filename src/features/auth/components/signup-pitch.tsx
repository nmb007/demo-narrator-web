"use client";

import { useSyncExternalStore } from "react";

import { GhostFibers } from "@/features/auth/components/ghost-fibers";

const FIBER_COLORS = {
  glow: "oklch(0.62 0.12 55)",
  line: "oklch(0.78 0.03 85)",
  secondary: "oklch(0.4 0.06 55)",
} as const;

type FiberColors = {
  glow: string;
  line: string;
  secondary: string;
};

let fiberColors: FiberColors = FIBER_COLORS;
let fiberColorsResolved = false;

function subscribeFiberColors() {
  return () => {};
}

function themeColor(
  style: CSSStyleDeclaration,
  name: string,
  fallback: string,
) {
  const value = style.getPropertyValue(name).trim();
  return value.length > 0 ? value : fallback;
}

function getFiberColorsSnapshot(): FiberColors {
  if (fiberColorsResolved) {
    return fiberColors;
  }
  fiberColorsResolved = true;
  const style = getComputedStyle(document.documentElement);
  const next = {
    glow: themeColor(style, "--copper", FIBER_COLORS.glow),
    line: themeColor(style, "--sand", FIBER_COLORS.line),
    secondary: themeColor(style, "--copper-deep", FIBER_COLORS.secondary),
  };
  if (
    next.glow === FIBER_COLORS.glow &&
    next.line === FIBER_COLORS.line &&
    next.secondary === FIBER_COLORS.secondary
  ) {
    return FIBER_COLORS;
  }
  fiberColors = next;
  return fiberColors;
}

function getFiberColorsServerSnapshot() {
  return FIBER_COLORS;
}

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onStoreChange);
  return () => {
    media.removeEventListener("change", onStoreChange);
  };
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function SignupPitch() {
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  const fiberColors = useSyncExternalStore(
    subscribeFiberColors,
    getFiberColorsSnapshot,
    getFiberColorsServerSnapshot,
  );

  return (
    <div className="bg-bay text-sand relative flex flex-1 flex-col gap-10 overflow-hidden p-8 lg:p-12">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <GhostFibers
          glowColor={fiberColors.glow}
          lineColor={fiberColors.line}
          secondaryColor={fiberColors.secondary}
          gradient="depth"
          fiberStyle="dots"
          layers={3}
          speed={0.42}
          glow={0.9}
          brightness={1.15}
          foldGlow={1.35}
          particles={0.4}
          sparkle={0.45}
          vignette={0.22}
          grain={0.05}
          mouseInteraction={false}
          hoverEffect="none"
          pulseOnClick={false}
          intro
          paused={reduceMotion}
        />
      </div>
      <div
        className="from-bay/80 via-bay/25 pointer-events-none absolute inset-0 bg-gradient-to-b via-[16%] to-transparent to-[36%]"
        aria-hidden
      />
      <div className="relative z-10 flex max-w-xl flex-col gap-6">
        <p className="text-sand text-xs font-medium tracking-[0.18em] uppercase">
          Demo Narrator
        </p>
        <h1 className="font-heading text-background text-4xl leading-tight tracking-tight sm:text-5xl">
          You speak, We narrate.
        </h1>
        <div className="relative">
          <div
            className="bg-bay/75 pointer-events-none absolute -inset-x-3 -inset-y-2 -z-10 rounded-lg blur-md"
            aria-hidden
          />
          <ul className="text-background flex flex-col gap-2 text-sm leading-relaxed sm:text-base">
            <li>Record your video in any language.</li>
            <li>Get clear, natural English narration.</li>
            <li>
              Enjoy perfectly synchronized voiceover that matches your video.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
