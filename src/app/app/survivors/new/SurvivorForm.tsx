"use client";

import { useActionState } from "react";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/Alert";
import { LinkButton } from "@/components/ui/Button";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import {
  US_STATES,
  SURVIVOR_STATUSES,
  LABELS,
} from "@/lib/constants";
import { createSurvivorAction } from "@/app/app/survivors/actions";
import { initialFormState } from "@/lib/forms";

export function SurvivorForm() {
  const [state, action] = useActionState(createSurvivorAction, initialFormState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action}>
      <Card>
        <CardBody className="space-y-6">
          {state.message && !state.ok && (
            <Alert tone="error">{state.message}</Alert>
          )}

          <section>
            <h3 className="mb-3 text-[14px] font-bold text-navy">Identity</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="First name" name="first_name" required error={fe.first_name} />
              <Input label="Last name" name="last_name" required error={fe.last_name} />
              <Input label="Phone" name="phone" type="tel" placeholder="+1 (555) 555-0100" />
              <Input label="Email" name="email" type="email" error={fe.email} />
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-[14px] font-bold text-navy">Disaster context</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Disaster event"
                name="disaster_event"
                placeholder="e.g. Hurricane Idalia"
              />
              <Input
                label="Primary need (free text)"
                name="primary_need_label"
                placeholder="Captured on the case record"
                disabled
                hint="Captured when you open a recovery case."
              />
              <Input label="County" name="county" />
              <Select label="State" name="state" defaultValue="" error={fe.state}>
                <option value="">—</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <Input
                label="Household size"
                name="household_size"
                type="number"
                min={0}
                max={30}
                placeholder="0"
                error={fe.household_size}
              />
              <Select label="Status" name="status" defaultValue="active" error={fe.status}>
                {SURVIVOR_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {LABELS.survivorStatus[s]}
                  </option>
                ))}
              </Select>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-[14px] font-bold text-navy">Notes</h3>
            <Textarea
              label="Intake notes"
              name="notes"
              rows={4}
              placeholder="Background, household context, language preferences, accessibility considerations…"
            />
          </section>

          <section>
            <h3 className="mb-3 text-[14px] font-bold text-navy">Consent</h3>
            <Checkbox
              name="consent_given"
              label="Survivor has provided informed consent for data collection and referrals."
              hint="Required before sending referrals to partner organizations."
            />
          </section>
        </CardBody>
        <CardFooter>
          <LinkButton href="/app/survivors" variant="outline">
            Cancel
          </LinkButton>
          <SubmitButton pendingLabel="Saving survivor…">Save survivor</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
