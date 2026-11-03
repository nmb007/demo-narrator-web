"use client";

import { useSyncExternalStore } from "react";

import { SignupConvertAnimation } from "@/features/auth/components/signup-convert-animation";

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

  return (
    <div className="bg-bay text-sand flex flex-1 flex-col justify-between gap-10 p-8 lg:p-12">
      <div className="flex max-w-xl flex-col gap-6">
        <p className="text-sand text-xs font-medium tracking-[0.18em] uppercase">
          Demo Narrator
        </p>
        <h1 className="font-heading text-background text-4xl leading-tight tracking-tight sm:text-5xl">
          You speak, We narrate.
        </h1>
        <ul className="flex flex-col gap-2 text-sm leading-relaxed sm:text-base">
          <li>Record your video in any language.</li>
          <li>Get clear, natural English narration.</li>
          <li>
            Enjoy perfectly synchronized voiceover that matches your video.
          </li>
        </ul>
      </div>
      <div className="w-full max-w-xl">
        <SignupConvertAnimation reduceMotion={reduceMotion} />
      </div>
    </div>
  );
}
