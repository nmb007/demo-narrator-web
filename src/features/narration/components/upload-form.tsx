"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { useUploadVideo } from "@/features/narration/api";
import { NarrationOptionsFields } from "@/features/narration/components/narration-options-fields";
import {
  UPLOAD_CANCELLED_MESSAGE,
  UPLOAD_FAILED_MESSAGE,
  UPLOAD_INTERRUPTED_MESSAGE,
  UPLOAD_SUCCESS_MESSAGE,
  uploadFieldErrors,
  uploadFormMessage,
} from "@/features/narration/errors";
import {
  UPLOAD_DEFAULTS,
  UploadSchema,
  type Upload,
  type UploadInput,
} from "@/features/narration/schemas";
import { ApiError } from "@/shared/api/errors";
import { env } from "@/shared/config/env";
import { formatBytes } from "@/shared/lib/format";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Progress } from "@/shared/ui/progress";
import { toast } from "@/shared/ui/sonner";

export function UploadForm() {
  const router = useRouter();
  const upload = useUploadVideo();
  const form = useForm<UploadInput, unknown, Upload>({
    resolver: zodResolver(UploadSchema),
    defaultValues: UPLOAD_DEFAULTS,
  });
  const pending = upload.isPending;
  const progress = upload.progress;
  const rootMessage = form.formState.errors.root?.message;
  const videoError = form.formState.errors.video;
  const showRetry = rootMessage === UPLOAD_INTERRUPTED_MESSAGE;

  function onSubmit(values: Upload) {
    form.clearErrors("root");
    upload.mutate(
      {
        video: values.video,
        voice: values.voice,
        max_atempo: values.max_atempo,
      },
      {
        onSuccess: () => {
          toast.success(UPLOAD_SUCCESS_MESSAGE);
          router.replace("/videos");
        },
        onError: (error) => {
          if (!(error instanceof ApiError)) {
            form.setError("root", { message: UPLOAD_FAILED_MESSAGE });
            return;
          }
          if (error.message === UPLOAD_CANCELLED_MESSAGE) {
            return;
          }
          const fields = uploadFieldErrors(error);
          for (const field of ["video", "voice", "max_atempo"] as const) {
            const message = fields[field];
            if (message) {
              form.setError(field, { message });
            }
          }
          const formMessage = uploadFormMessage(error);
          if (formMessage) {
            form.setError("root", { message: formMessage });
          }
        },
      },
    );
  }

  const progressValue =
    progress?.phase === "uploading" && progress.total > 0
      ? Math.min(100, Math.round((progress.loaded / progress.total) * 100))
      : undefined;
  const progressLabel =
    progress?.phase === "validating"
      ? "Validating video…"
      : progress?.phase === "uploading"
        ? `Uploading… ${progressValue ?? 0}%`
        : null;

  return (
    <form
      className="flex max-w-xl flex-col gap-5"
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
    >
      {rootMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{rootMessage}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup>
        <Field data-invalid={videoError ? true : undefined}>
          <FieldLabel htmlFor="video">Video file</FieldLabel>
          <Input
            id="video"
            type="file"
            accept=".mov,.mp4,video/quicktime,video/mp4"
            disabled={pending}
            aria-invalid={videoError ? true : undefined}
            {...(videoError ? { "aria-describedby": "video-error" } : {})}
            {...form.register("video")}
          />
          <p className="text-muted-foreground text-xs">
            .mov or .mp4, up to {formatBytes(env.uploadMaxBytes)}.
          </p>
          <FieldError id="video-error" errors={[videoError]} />
        </Field>

        <NarrationOptionsFields
          register={form.register}
          errors={form.formState.errors}
          disabled={pending}
        />
      </FieldGroup>

      {progress ? (
        <div className="flex flex-col gap-2" aria-live="polite">
          <Progress
            value={progressValue}
            max={100}
            aria-label={progressLabel ?? "Upload progress"}
          />
          {progressLabel ? (
            <p className="text-muted-foreground text-sm">{progressLabel}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Uploading…" : "Upload video"}
        </Button>
        {pending ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              upload.cancel();
            }}
          >
            Cancel
          </Button>
        ) : null}
        {showRetry && !pending ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void form.handleSubmit(onSubmit)();
            }}
          >
            Retry
          </Button>
        ) : null}
      </div>
    </form>
  );
}
