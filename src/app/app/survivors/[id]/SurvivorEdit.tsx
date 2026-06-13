"use client";

import { useActionState } from "react";
import { Select, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/Alert";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import {
  SURVIVOR_STATUSES,
  LABELS,
} from "@/lib/constants";
import { updateSurvivorAction } from "@/app/app/survivors/actions";
import { initialFormState, type FormState } from "@/lib/forms";
import type { SurvivorStatus } from "@/lib/types";

export function SurvivorEdit({
  id,
  defaults,
  managers,
}: {
  id: string;
  defaults: {
    status: SurvivorStatus;
    assigned_case_manager: string | null;
    notes: string | null;
  };
  managers: { id: string; label: string }[];
}) {
  const boundAction = updateSurvivorAction.bind(null, id);
  const [state, action] = useActionState<FormState, FormData>(boundAction, initialFormState);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action}>
      <Card>
        <CardBody className="space-y-5">
          {state.message && (
            <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
          )}

          <Select
            label="Status"
            name="status"
            defaultValue={defaults.status}
            error={fe.status}
          >
            {SURVIVOR_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LABELS.survivorStatus[s]}
              </option>
            ))}
          </Select>

          <Select
            label="Assigned case manager"
            name="assigned_case_manager"
            defaultValue={defaults.assigned_case_manager ?? ""}
          >
            <option value="">— Unassigned</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </Select>

          <Textarea
            label="Intake notes"
            name="notes"
            rows={5}
            defaultValue={defaults.notes ?? ""}
          />
        </CardBody>
        <CardFooter>
          <SubmitButton size="sm">Save changes</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
