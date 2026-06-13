"use client";

import { useActionState } from "react";
import { Select, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/Alert";
import { LinkButton } from "@/components/ui/Button";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import {
  LABELS,
  NEED_CATEGORIES,
  NEED_STATUSES,
  PRIORITIES,
} from "@/lib/constants";
import { createNeedAction } from "@/app/app/unmet-needs/actions";
import { initialFormState } from "@/lib/forms";

export function NeedForm({
  survivors,
  defaultSurvivorId,
}: {
  survivors: { id: string; label: string }[];
  defaultSurvivorId?: string;
}) {
  const [state, action] = useActionState(createNeedAction, initialFormState);
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

          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Category" name="category" required defaultValue="" error={fe.category}>
              <option value="" disabled>
                Select category
              </option>
              {NEED_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select label="Priority" name="priority" defaultValue="medium" error={fe.priority}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {LABELS.priority[p]}
                </option>
              ))}
            </Select>
            <Select label="Status" name="status" defaultValue="open" error={fe.status}>
              {NEED_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {LABELS.needStatus[s]}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Description"
            name="description"
            rows={4}
            required
            error={fe.description}
            placeholder="What does the survivor need? Be specific — partners use this verbatim."
          />
        </CardBody>
        <CardFooter>
          <LinkButton href="/app/unmet-needs" variant="outline">
            Cancel
          </LinkButton>
          <SubmitButton pendingLabel="Saving…">Capture need</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
