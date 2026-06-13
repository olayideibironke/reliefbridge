"use client";

import { useActionState } from "react";
import { Checkbox } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/Alert";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import { updateNotificationsAction } from "@/app/app/settings/actions";
import { initialFormState } from "@/lib/forms";
import type { Profile } from "@/lib/types";

export function NotificationsForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(updateNotificationsAction, initialFormState);
  const s = profile.notification_settings;
  return (
    <form action={action}>
      <Card>
        <CardBody className="space-y-5">
          {state.message && (
            <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
          )}
          <Checkbox
            name="new_case"
            label="New recovery cases"
            hint="Email me when a case is opened against a survivor I manage."
            defaultChecked={s.new_case}
          />
          <Checkbox
            name="new_referral"
            label="New incoming referrals"
            hint="Email me when a partner refers a survivor to us."
            defaultChecked={s.new_referral}
          />
          <Checkbox
            name="referral_status_change"
            label="Referral status changes"
            hint="Email me when a referral I sent is accepted, declined, or completed."
            defaultChecked={s.referral_status_change}
          />
          <Checkbox
            name="weekly_digest"
            label="Weekly coordination digest"
            hint="A Monday summary of cases, referrals, and unmet needs."
            defaultChecked={s.weekly_digest}
          />
        </CardBody>
        <CardFooter>
          <SubmitButton>Save preferences</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
