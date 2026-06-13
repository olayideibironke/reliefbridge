"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/Alert";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import { updateProfileAction } from "@/app/app/settings/actions";
import { initialFormState } from "@/lib/forms";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(updateProfileAction, initialFormState);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action}>
      <Card>
        <CardBody className="space-y-5">
          {state.message && (
            <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              name="first_name"
              required
              defaultValue={profile.first_name ?? ""}
              error={fe.first_name}
            />
            <Input
              label="Last name"
              name="last_name"
              required
              defaultValue={profile.last_name ?? ""}
              error={fe.last_name}
            />
          </div>
          <Input
            label="Title"
            name="title"
            placeholder="e.g. Recovery Director, Case Manager"
            defaultValue={profile.title ?? ""}
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            defaultValue={profile.phone ?? ""}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            disabled
            defaultValue={profile.email ?? ""}
            hint="Email is tied to your sign-in. Contact support to change."
          />
        </CardBody>
        <CardFooter>
          <SubmitButton>Save profile</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
