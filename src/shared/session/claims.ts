import { decodeJwt } from "jose";
import { z } from "zod";

const ClaimsSchema = z.object({
  sub: z.string().min(1),
  email: z.email(),
  exp: z.number(),
});

export type Claims = z.infer<typeof ClaimsSchema>;

export function readClaims(token: string): Claims | null {
  try {
    const parsed = ClaimsSchema.safeParse(decodeJwt(token));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
