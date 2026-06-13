"use client";

import { useActionState } from "react";
import { Input, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/Alert";
import { ORG_TYPES, US_STATES } from "@/lib/constants";
import { signupAction } from "@/app/(auth)/actions";
import { initialFormState as authInitialState } from "@/lib/forms";

export function SignupForm() {
  const [state, action] = useActionState(signupAction, authInitialState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      {state.message && (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      )}

      <div className="space-y-1">
        <div className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-ink-3">
          About you
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="First name" name="first_name" required error={fe.first_name} autoComplete="given-name" />
        <Input label="Last name" name="last_name" required error={fe.last_name} autoComplete="family-name" />
      </div>
      <Input
        label="Work email"
        name="email"
        type="email"
        required
        autoComplete="email"
        error={fe.email}
      />
      <Input
        label="Password"
        name="password"
        type="password"
        required
        autoComplete="new-password"
        hint="At least 8 characters."
        error={fe.password}
      />

      <div className="pt-3">
        <div className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-ink-3">
          Your organization
        </div>
      </div>
      <Input
        label="Organization name"
        name="org_name"
        required
        error={fe.org_name}
        placeholder="Gulf Coast Long-Term Recovery Group"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select label="Type" name="org_type" required error={fe.org_type} defaultValue="">
          <option value="" disabled>
            Select organization type
          </option>
          {ORG_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Select label="State" name="org_state" error={fe.org_state} defaultValue="">
          <option value="">—</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
      <Input
        label="City"
        name="org_city"
        placeholder="Optional"
      />

      <SubmitButton className="w-full" pendingLabel="Creating account…">
        Create ReliefBridge account
      </SubmitButton>

      <p className="text-[12.5px] leading-5 text-ink-3">
        By creating an account you agree to ReliefBridge&apos;s Terms of Service and
        acknowledge the Privacy Notice covering survivor data handling.
      </p>
    </form>
  );
}
