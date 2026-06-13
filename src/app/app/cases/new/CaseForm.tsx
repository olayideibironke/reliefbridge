"use client";

import { useActionState } from "react";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/Alert";
import { LinkButton } from "@/components/ui/Button";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import {
  CASE_STATUSES,
  LABELS,
  PRIORITIES,
} from "@/lib/constants";
import { createCaseAction } from "@/app/app/cases/actions";
import { initialFormState } from "@/lib/forms";

export function CaseForm({
  survivors,
  managers,
  defaultSurvivorId,
}: {
  survivors: { id: string; label: string }[];
  managers: { id: string; label: string }[];
  defaultSurvivorId?: string;
}) {
  const [state, action] = useActionState(createCaseAction, initialFormState);
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

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Disaster type"
              name="disaster_type"
              placeholder="e.g. Hurricane, wildfire, tornado, flood"
            />
            <Input
              label="Primary need"
              name="primary_need"
              placeholder="e.g. Emergency housing"
            />
            <Select label="Priority" name="priority" defaultValue="medium" error={fe.priority}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {LABELS.priority[p]}
                </option>
              ))}
            </Select>
            <Select label="Status" name="status" defaultValue="open" error={fe.status}>
              {CASE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {LABELS.caseStatus[s]}
                </option>
              ))}
            </Select>
            <Select
              label="Case manager"
              name="case_manager"
              defaultValue=""
              className="sm:col-span-2"
            >
              <option value="">— Unassigned</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Opening notes"
            name="notes"
            rows={4}
            placeholder="Initial summary of the case, immediate next steps, partner agencies engaged…"
          />
        </CardBody>
        <CardFooter>
          <LinkButton href="/app/cases" variant="outline">
            Cancel
          </LinkButton>
          <SubmitButton pendingLabel="Saving case…">Open case</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
