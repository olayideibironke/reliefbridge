"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Input, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/Alert";
import { ORG_TYPES, US_STATES } from "@/lib/constants";
import { signupAction } from "@/app/(auth)/actions";
import { initialFormState as authInitialState } from "@/lib/forms";

export function SignupForm() {
  const [state, action] = useActionState(signupAction, authInitialState);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const fe = state.fieldErrors ?? {};

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");

    if (typeof email === "string") {
      setSubmittedEmail(email);
    }
  }

  if (state.ok) {
    return (
      <div className="overflow-hidden rounded-md border border-[#B7D7C2] bg-white shadow-lift">
        <div className="border-l-8 border-[#1B7F4C] bg-[#EEF8F1] px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#1B7F4C] text-[22px] font-black text-white">
              ✓
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#1B7F4C]">
                Account confirmation required
              </div>
              <h2 className="mt-2 text-[28px] font-black leading-tight tracking-tight text-navy">
                Check Your Email
              </h2>
              <p className="mt-3 text-[15px] leading-6 text-ink-2">
                We&apos;ve sent a confirmation link to:
              </p>

              {submittedEmail && (
                <div className="mt-3 inline-flex rounded-sm border border-[#B7D7C2] bg-white px-4 py-2 text-[15px] font-bold text-navy">
                  {submittedEmail}
                </div>
              )}

              <p className="mt-5 max-w-xl text-[15px] leading-6 text-ink-2">
                Please confirm your email address to activate your ReliefBridge
                workspace. Once confirmed, return here and sign in.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-6">
          <div className="rounded-sm border border-line bg-surface-2 px-5 py-4">
            <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-ink-3">
              Didn&apos;t receive the email?
            </div>
            <p className="mt-2 text-[14px] leading-6 text-ink-2">
              Check your spam or promotions folder. Supabase sends confirmation
              emails from its default sender until ReliefBridge SMTP is
              connected.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-sm bg-navy px-5 py-3 text-[14px] font-semibold text-white hover:bg-navy-light hover:no-underline"
            >
              Go to sign in
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-sm border border-line bg-white px-5 py-3 text-[14px] font-semibold text-navy hover:border-blue hover:text-blue hover:no-underline"
            >
              Back to public site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="space-y-5">
      {state.message && (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      )}

      <div className="space-y-1">
        <div className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-ink-3">
          About you
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First name"
          name="first_name"
          required
          error={fe.first_name}
          autoComplete="given-name"
        />
        <Input
          label="Last name"
          name="last_name"
          required
          error={fe.last_name}
          autoComplete="family-name"
        />
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
        <Select
          label="Type"
          name="org_type"
          required
          error={fe.org_type}
          defaultValue=""
        >
          <option value="" disabled>
            Select organization type
          </option>
          {ORG_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>

        <Select
          label="State"
          name="org_state"
          error={fe.org_state}
          defaultValue=""
        >
          <option value="">—</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <Input label="City" name="org_city" placeholder="Optional" />

      <SubmitButton className="w-full" pendingLabel="Creating account…">
        Create ReliefBridge account
      </SubmitButton>

      <p className="text-[12.5px] leading-5 text-ink-3">
        By creating an account you agree to ReliefBridge&apos;s Terms of Service
        and acknowledge the Privacy Notice covering survivor data handling.
      </p>
    </form>
  );
}