"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/Alert";
import { loginAction } from "@/app/(auth)/actions";
import { initialFormState as authInitialState } from "@/lib/forms";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(loginAction, authInitialState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      {state.message && !state.ok && (
        <Alert tone="error">{state.message}</Alert>
      )}

      <Input
        label="Work email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="you@your-organization.org"
        error={fe.email}
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        placeholder="Enter your password"
        error={fe.password}
      />

      <SubmitButton className="w-full" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
