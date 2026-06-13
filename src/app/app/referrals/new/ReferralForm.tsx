"use client";

import { useActionState } from "react";
import { Select, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/Alert";
import { LinkButton } from "@/components/ui/Button";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import { NEED_CATEGORIES } from "@/lib/constants";
import { createReferralAction } from "@/app/app/referrals/actions";
import { initialFormState } from "@/lib/forms";

export function ReferralForm({
  survivors,
  partners,
  defaultSurvivorId,
}: {
  survivors: { id: string; label: string }[];
  partners: { id: string; label: string }[];
  defaultSurvivorId?: string;
}) {
  const [state, action] = useActionState(createReferralAction, initialFormState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action}>
      <Card>
        <CardBody className="space-y-5">
          {state.message && !state.ok && (
            <Alert tone="error">{state.message}</Alert>
          )}

          <Select
            label="Survivor"
            name="survivor_id"
            required
            defaultValue={defaultSurvivorId ?? ""}
            error={fe.survivor_id}
          >
            <option value="" disabled>
              Select survivor
            </option>
            {survivors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>

          <Select
            label="Receiving partner organization"
            name="receiving_org"
            required
            defaultValue=""
            error={fe.receiving_org}
          >
            <option value="" disabled>
              Select partner organization
            </option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>

          <Select
            label="Category"
            name="category"
            required
            defaultValue=""
            error={fe.category}
          >
            <option value="" disabled>
              Select category
            </option>
            {NEED_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>

          <Textarea
            label="Notes for partner"
            name="notes"
            rows={5}
            placeholder="Context the receiving partner should see (specific need, urgency, consent, contact preferences, etc.)"
          />
        </CardBody>
        <CardFooter>
          <LinkButton href="/app/referrals" variant="outline">
            Cancel
          </LinkButton>
          <SubmitButton pendingLabel="Sending referral…">Send referral</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
