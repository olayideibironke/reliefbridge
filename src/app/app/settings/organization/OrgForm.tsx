"use client";

import { useActionState } from "react";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/Alert";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import { ORG_TYPES, US_STATES } from "@/lib/constants";
import { updateOrgAction } from "@/app/app/settings/actions";
import { initialFormState } from "@/lib/forms";
import type { Organization } from "@/lib/types";

export function OrgForm({ org }: { org: Organization }) {
  const [state, action] = useActionState(updateOrgAction, initialFormState);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action}>
      <Card>
        <CardBody className="space-y-5">
          {state.message && (
            <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
          )}
          <Input label="Organization name" name="name" required defaultValue={org.name} error={fe.name} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Type" name="type" required defaultValue={org.type} error={fe.type}>
              {ORG_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Input label="City" name="city" defaultValue={org.city ?? ""} />
            <Select label="State" name="state" defaultValue={org.state ?? ""} error={fe.state}>
              <option value="">—</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Input
              label="Website"
              name="website"
              type="url"
              placeholder="https://example.org"
              defaultValue={org.website ?? ""}
              error={fe.website}
            />
            <Input label="Phone" name="phone" type="tel" defaultValue={org.phone ?? ""} />
            <Input
              label="Email"
              name="email"
              type="email"
              defaultValue={org.email ?? ""}
              error={fe.email}
            />
          </div>
          <Textarea
            label="About"
            name="description"
            rows={5}
            defaultValue={org.description ?? ""}
            placeholder="What does your organization do? Service area, capacity, specialties…"
          />
        </CardBody>
        <CardFooter>
          <SubmitButton>Save organization</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
