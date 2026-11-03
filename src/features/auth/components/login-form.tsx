"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { useLogin } from "@/features/auth/api";
import {
  LOGIN_FAILED_MESSAGE,
  loginFieldErrors,
  loginFormMessage,
} from "@/features/auth/errors";
import { SIGNED_IN_PATH, safeAppRoute } from "@/features/auth/login-path";
import { LoginSchema, type Login } from "@/features/auth/schemas";
import { ApiError } from "@/shared/api/errors";
import { peekSessionEnd } from "@/shared/session/session-store";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const form = useForm<Login>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { username: "", password: "" },
  });
  const pending = login.isPending;
  const expired =
    searchParams.get("reason") === "expired" || peekSessionEnd() === "expired";

  function onSubmit(values: Login) {
    const destination = safeAppRoute(searchParams.get("next"), SIGNED_IN_PATH);
    login.mutate(values, {
      onSuccess: () => {
        router.replace(destination);
      },
      onError: (error) => {
        if (!(error instanceof ApiError)) {
          form.setError("root", { message: LOGIN_FAILED_MESSAGE });
          return;
        }
        const fields = loginFieldErrors(error);
        for (const field of ["username", "password"] as const) {
          const message = fields[field];
          if (message) {
            form.setError(field, { message });
          }
        }
        const formMessage = loginFormMessage(error);
        if (formMessage) {
          form.setError("root", { message: formMessage });
        }
      },
    });
  }

  const rootMessage = form.formState.errors.root?.message;
  const usernameError = form.formState.errors.username;
  const passwordError = form.formState.errors.password;

  return (
    <div className="flex flex-col gap-5">
      {expired ? (
        <Alert>
          <AlertTitle>Your session expired.</AlertTitle>
          <AlertDescription>Log in again to continue.</AlertDescription>
        </Alert>
      ) : null}
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
          <Field data-invalid={usernameError ? true : undefined}>
            <FieldLabel htmlFor="username">Email</FieldLabel>
            <Input
              id="username"
              type="email"
              autoComplete="email"
              disabled={pending}
              aria-invalid={usernameError ? true : undefined}
              {...(usernameError
                ? { "aria-describedby": "username-error" }
                : {})}
              {...form.register("username")}
            />
            <FieldError id="username-error" errors={[usernameError]} />
          </Field>
          <Field data-invalid={passwordError ? true : undefined}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={pending}
              aria-invalid={passwordError ? true : undefined}
              {...(passwordError
                ? { "aria-describedby": "password-error" }
                : {})}
              {...form.register("password")}
            />
            <FieldError id="password-error" errors={[passwordError]} />
          </Field>
        </FieldGroup>
        <Button type="submit" disabled={pending}>
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>
      <p className="text-muted-foreground text-sm">
        Need an account?{" "}
        <Link
          href="/signup"
          className="text-foreground focus-visible:ring-ring rounded-sm font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
