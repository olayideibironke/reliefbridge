"use client";

import { useActionState } from "react";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/Alert";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import {
  CASE_STATUSES,
  LABELS,
  PRIORITIES,
} from "@/lib/constants";
import { updateCaseAction, addCaseNoteAction } from "@/app/app/cases/actions";
import { initialFormState, type FormState } from "@/lib/forms";
import type { CaseStatus, Priority } from "@/lib/types";

export function CaseEdit({
  id,
  defaults,
  managers,
}: {
  id: string;
  defaults: {
    case_manager: string | null;
    priority: Priority;
    status: CaseStatus;
    primary_need: string | null;
    notes: string | null;
  };
  managers: { id: string; label: string }[];
}) {
  const boundAction = updateCaseAction.bind(null, id);
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
            label="Case manager"
            name="case_manager"
            defaultValue={defaults.case_manager ?? ""}
          >
            <option value="">— Unassigned</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </Select>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Priority" name="priority" defaultValue={defaults.priority} error={fe.priority}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {LABELS.priority[p]}
                </option>
              ))}
            </Select>
            <Select label="Status" name="status" defaultValue={defaults.status} error={fe.status}>
              {CASE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {LABELS.caseStatus[s]}
                </option>
              ))}
            </Select>
          </div>
          <Input
            label="Primary need"
            name="primary_need"
            defaultValue={defaults.primary_need ?? ""}
          />
          <Textarea
            label="Case notes"
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

export function CaseNoteForm({ caseId }: { caseId: string }) {
  const boundAction = addCaseNoteAction.bind(null, caseId);
  const [state, action] = useActionState<FormState, FormData>(boundAction, initialFormState);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-3">
      {state.message && !state.ok && (
        <Alert tone="error">{state.message}</Alert>
      )}
      <Textarea
        label="Add a note"
        name="body"
        rows={3}
        placeholder="Status update, partner contact, decision, follow-up needed…"
        error={fe.body}
      />
      <div className="flex justify-end">
        <SubmitButton size="sm" pendingLabel="Adding…">
          Add note
        </SubmitButton>
      </div>
    </form>
  );
}
