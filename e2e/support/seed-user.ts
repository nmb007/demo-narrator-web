import { createAccount } from "@/features/auth/api";

export async function seedUser(email: string, password: string): Promise<void> {
  await createAccount({ email, password });
}
