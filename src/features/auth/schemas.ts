import { z } from "zod";

export const SignupSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(128, "Use at most 128 characters."),
});

export type Signup = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  username: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(1, "Enter your password.")
    .max(128, "Use at most 128 characters."),
});

export type Login = z.infer<typeof LoginSchema>;
