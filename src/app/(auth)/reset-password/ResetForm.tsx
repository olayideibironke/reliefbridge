"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/Alert";
import { resetPasswordAction } from "@/app/(auth)/actions";
import { initialFormState as authInitialState } from "@/lib/forms";

export function ResetForm() {
  const [state, action] = useActionState(resetPasswordAction, authInitialState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      {state.message && !state.ok && (
        <Alert tone="error">{state.message}</Alert>
      )}
      <Input
        label="New password"
        name="password"
        type="password"
        required
        autoComplete="new-password"
        hint="At least 8 characters."
        error={fe.password}
      />
      <Input
        label="Confirm new password"
        name="confirm"
        type="password"
        required
        autoComplete="new-password"
        error={fe.confirm}
      />
      <SubmitButton className="w-full" pendingLabel="Updating password…">
        Update password
      </SubmitButton>
    </form>
  );
}
