"use client";

import { useActionState, useState } from "react";
import { resetDemoPasswordAction, type DemoHubState } from "./actions";
import { Button } from "@/components/ui/Button";

const initialState: DemoHubState = { ok: false, message: null };

function copyFallback(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

export function ResetPasswordControl({ demoId }: { demoId: string }) {
  const [state, action, pending] = useActionState(resetDemoPasswordAction, initialState);
  const [copied, setCopied] = useState(false);

  async function copyPassword() {
    const password = state.credentials?.password;
    if (!password) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(password);
      ok = true;
    } catch {
      ok = copyFallback(password);
    }
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <form action={action}>
        <input type="hidden" name="demo_id" value={demoId} />
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Resetting..." : "Reset password"}
        </Button>
      </form>
      {state.credentials?.password && (
        <div className="w-[250px] rounded-sm border border-blue/20 bg-blue-soft p-3 text-left">
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue">
            New password
          </div>
          <div className="mt-1 break-all font-mono text-[12px] font-bold text-navy">
            {state.credentials.password}
          </div>
          <button
            type="button"
            onClick={copyPassword}
            className="mt-2 inline-flex h-8 w-full items-center justify-center rounded-sm border border-blue/20 bg-white px-3 text-[11.5px] font-bold text-blue hover:border-blue"
          >
            {copied ? "Copied!" : "Copy password"}
          </button>
        </div>
      )}
      {state.message && !state.credentials && (
        <div className="max-w-[240px] text-[11px] text-ink-3">{state.message}</div>
      )}
    </div>
  );
}
