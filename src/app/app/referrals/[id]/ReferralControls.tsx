"use client";

import { useActionState } from "react";

import { Select, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/Alert";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import { REFERRAL_STATUSES } from "@/lib/constants";
import {
  updateReferralStatusAction,
  updateReferralNotesAction,
} from "@/app/app/referrals/actions";
import { initialFormState, type FormState } from "@/lib/forms";
import type { ReferralStatus } from "@/lib/types";

export function ReferralStatusControl({
  id,
  current,
  side,
}: {
  id: string;
  current: ReferralStatus;
  side: "sender" | "receiver";
}) {
  const boundAction = updateReferralStatusAction.bind(null, id);

  const [state, action] = useActionState<FormState, FormData>(
    boundAction,
    initialFormState,
  );

  const allowed: ReferralStatus[] =
    side === "receiver"
      ? ["Pending", "Accepted", "In Progress", "Completed", "Declined"]
      : ["Pending", "Completed", "Declined"];

  return (
    <form action={action}>
      <Card>
        <CardBody className="space-y-3">
          {state.message && (
            <Alert tone={state.ok ? "success" : "error"}>
              {state.message}
            </Alert>
          )}

          <Select
            key={`${id}-${current}`}
            label={
              side === "receiver"
                ? "Update status (you received this)"
                : "Update status"
            }
            name="status"
            defaultValue={current}
          >
            {REFERRAL_STATUSES.map((status) => (
              <option
                key={status}
                value={status}
                disabled={!allowed.includes(status)}
              >
                {status}
              </option>
            ))}
          </Select>
        </CardBody>

        <CardFooter>
          <SubmitButton size="sm">Save status</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}

export function ReferralNotesEdit({
  id,
  notes,
}: {
  id: string;
  notes: string | null;
}) {
  const boundAction = updateReferralNotesAction.bind(null, id);

  const [state, action] = useActionState<FormState, FormData>(
    boundAction,
    initialFormState,
  );

  return (
    <form action={action}>
      <Card>
        <CardBody className="space-y-3">
          {state.message && (
            <Alert tone={state.ok ? "success" : "error"}>
              {state.message}
            </Alert>
          )}

          <Textarea
            label="Notes for partner"
            name="notes"
            rows={5}
            defaultValue={notes ?? ""}
            placeholder="Notes the partner will see with this referral."
          />
        </CardBody>

        <CardFooter>
          <SubmitButton size="sm">Update notes</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}