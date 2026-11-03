"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { useSignup } from "@/features/auth/api";
import {
  signupFieldErrors,
  signupFormMessage,
  SIGNUP_FAILED_MESSAGE,
} from "@/features/auth/errors";
import { SIGNED_IN_PATH } from "@/features/auth/login-path";
import { SignupSchema, type Signup } from "@/features/auth/schemas";
import { ApiError } from "@/shared/api/errors";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

export function SignupForm() {
  const router = useRouter();
  const signup = useSignup();
  const form = useForm<Signup>({
    resolver: zodResolver(SignupSchema),
    defaultValues: { email: "", password: "" },
  });
  const pending = signup.isPending;

  function onSubmit(values: Signup) {
    signup.mutate(values, {
      onSuccess: () => {
        router.replace(SIGNED_IN_PATH);
      },
      onError: (error) => {
        if (!(error instanceof ApiError)) {
          form.setError("root", { message: SIGNUP_FAILED_MESSAGE });
          return;
        }
        const fields = signupFieldErrors(error);
        for (const field of ["email", "password"] as const) {
          const message = fields[field];
          if (message) {
            form.setError(field, { message });
          }
        }
        const formMessage = signupFormMessage(error);
        if (formMessage) {
          form.setError("root", { message: formMessage });
        }
      },
    });
  }

  const rootMessage = form.formState.errors.root?.message;
  const emailError = form.formState.errors.email;
  const passwordError = form.formState.errors.password;

  return (
    <form
      className="flex flex-col gap-5"
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
    >
      {rootMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{rootMessage}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <Field data-invalid={emailError ? true : undefined}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            disabled={pending}
            aria-invalid={emailError ? true : undefined}
            {...(emailError ? { "aria-describedby": "email-error" } : {})}
            {...form.register("email")}
          />
          <FieldError id="email-error" errors={[emailError]} />
        </Field>
        <Field data-invalid={passwordError ? true : undefined}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            disabled={pending}
            aria-invalid={passwordError ? true : undefined}
            {...(passwordError ? { "aria-describedby": "password-error" } : {})}
            {...form.register("password")}
          />
          <FieldError id="password-error" errors={[passwordError]} />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
