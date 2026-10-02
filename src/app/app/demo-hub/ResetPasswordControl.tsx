"use client";

import { useActionState } from "react";
import { resetDemoPasswordAction, type DemoHubState } from "./actions";
import { Button } from "@/components/ui/Button";

const initialState: DemoHubState = { ok: false, message: null };

export function ResetPasswordControl({ demoId }: { demoId: string }) {
  const [state, action, pending] = useActionState(resetDemoPasswordAction, initialState);
  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action}>
        <input type="hidden" name="demo_id" value={demoId} />
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Resetting..." : "Reset password"}
        </Button>
      </form>
      {state.credentials?.password && (
        <div className="max-w-[260px] rounded-sm border border-blue/20 bg-blue-soft px-3 py-2 text-left">
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue">New password, copy now</div>
          <div className="mt-1 break-all font-mono text-[12px] font-bold text-navy">{state.credentials.password}</div>
        </div>
      )}
      {state.message && !state.credentials && <div className="max-w-[240px] text-[11px] text-ink-3">{state.message}</div>}
    </div>
  );
}
