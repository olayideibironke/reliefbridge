"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/Alert";
import { forgotPasswordAction } from "@/app/(auth)/actions";
import { initialFormState as authInitialState } from "@/lib/forms";

export function ForgotForm() {
  const [state, action] = useActionState(forgotPasswordAction, authInitialState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      {state.message && (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      )}
      <Input
        label="Work email"
        name="email"
        type="email"
        required
        autoComplete="email"
        error={fe.email}
        placeholder="you@your-organization.org"
      />
      <SubmitButton className="w-full" pendingLabel="Sending link…">
        Send reset link
      </SubmitButton>
    </form>
  );
}
