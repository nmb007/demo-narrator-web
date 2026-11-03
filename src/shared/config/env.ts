import { z } from "zod";

const EnvSchema = z.object({
  apiBaseUrl: z.url(),
  uploadMaxBytes: z.number().int().positive(),
  appEnv: z.enum(["local", "preview", "production"]),
});

export type AppEnv = z.infer<typeof EnvSchema>;

function readEnv(): AppEnv {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV;
  const parsed = EnvSchema.safeParse({
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    uploadMaxBytes: Number(process.env.NEXT_PUBLIC_UPLOAD_MAX_BYTES),
    appEnv: appEnv === undefined || appEnv === "" ? "local" : appEnv,
  });
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => issue.message)
      .join("; ");
    throw new Error(`Invalid environment: ${message}`);
  }
  return Object.freeze(parsed.data);
}

export const env = readEnv();
