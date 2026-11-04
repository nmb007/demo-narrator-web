"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";

import {
  MAX_MAX_ATEMPO,
  MIN_MAX_ATEMPO,
  NARRATION_VOICES,
} from "@/features/narration/domain";
import type { UploadInput } from "@/features/narration/schemas";
import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

type NarrationOptionsFieldsProps = {
  register: UseFormRegister<UploadInput>;
  errors: FieldErrors<UploadInput>;
  disabled?: boolean;
};

export function NarrationOptionsFields({
  register,
  errors,
  disabled = false,
}: NarrationOptionsFieldsProps) {
  const voiceError = errors.voice;
  const atempoError = errors.max_atempo;

  return (
    <details className="border-border/80 rounded-lg border px-4 py-3">
      <summary className="text-foreground cursor-pointer text-sm font-medium">
        Advanced options
      </summary>
      <div className="mt-4 flex flex-col gap-4">
        <Field data-invalid={voiceError ? true : undefined}>
          <FieldLabel htmlFor="voice">Voice</FieldLabel>
          <select
            id="voice"
            disabled={disabled}
            aria-invalid={voiceError ? true : undefined}
            {...(voiceError ? { "aria-describedby": "voice-error" } : {})}
            className="border-input bg-background focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("voice")}
          >
            {NARRATION_VOICES.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.label}
              </option>
            ))}
          </select>
          <FieldError id="voice-error" errors={[voiceError]} />
        </Field>

        <Field data-invalid={atempoError ? true : undefined}>
          <FieldLabel htmlFor="max_atempo">Max tempo</FieldLabel>
          <Input
            id="max_atempo"
            type="number"
            step="0.1"
            min={MIN_MAX_ATEMPO}
            max={MAX_MAX_ATEMPO}
            disabled={disabled}
            aria-invalid={atempoError ? true : undefined}
            {...(atempoError ? { "aria-describedby": "max_atempo-error" } : {})}
            {...register("max_atempo")}
          />
          <p className="text-muted-foreground text-xs">
            Upper limit for speeding up voice to match the video (
            {MIN_MAX_ATEMPO}–{MAX_MAX_ATEMPO}×).
          </p>
          <FieldError id="max_atempo-error" errors={[atempoError]} />
        </Field>
      </div>
    </details>
  );
}
