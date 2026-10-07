"use client";

import { useMemo, useState } from "react";

const BASE_USERS = 15;
const BASE_MONTHLY = 749;
const EXTRA_USER_MONTHLY = 49;

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function QuoteCalculator({ opportunityId, currentValue }: { opportunityId: string; currentValue: number | null }) {
  const [users, setUsers] = useState(15);
  const extraUsers = Math.max(0, users - BASE_USERS);
  const monthly = BASE_MONTHLY + extraUsers * EXTRA_USER_MONTHLY;
  const annual = monthly * 12;
  const summary = useMemo(
    () => `ReliefBridge Complete: ${money(BASE_MONTHLY)}/month\n${extraUsers} additional organizational users × ${money(EXTRA_USER_MONTHLY)}: ${money(extraUsers * EXTRA_USER_MONTHLY)}/month\nTotal: ${money(monthly)}/month\nAnnual value: ${money(annual)}`,
    [extraUsers, monthly, annual],
  );

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="quote_users" className="text-[12.5px] font-bold text-navy">Licensed organizational users</label>
        <input id="quote_users" type="number" min="1" max="500" value={users} onChange={(e) => setUsers(Math.max(1, Math.min(500, Number(e.target.value) || 1)))} className="mt-2 h-11 w-full rounded-sm border border-line px-3 text-sm text-navy" />
        <p className="mt-2 text-[12px] text-ink-3">Up to 15 users are included in the $749/month base subscription. Additional users are $49/user/month.</p>
      </div>

      <div className="rounded-md border border-line bg-surface-2 p-4">
        <div className="flex justify-between gap-4 text-sm"><span className="text-ink-2">ReliefBridge Complete</span><strong className="text-navy">{money(BASE_MONTHLY)}/mo</strong></div>
        <div className="mt-2 flex justify-between gap-4 text-sm"><span className="text-ink-2">Additional users ({extraUsers} × $49)</span><strong className="text-navy">{money(extraUsers * EXTRA_USER_MONTHLY)}/mo</strong></div>
        <div className="mt-3 border-t border-line pt-3">
          <div className="flex justify-between gap-4"><span className="font-bold text-navy">Monthly quote</span><strong className="text-lg text-navy">{money(monthly)}</strong></div>
          <div className="mt-1 flex justify-between gap-4 text-sm"><span className="text-ink-2">Annual contract value</span><strong className="text-navy">{money(annual)}</strong></div>
        </div>
      </div>

      <form action="/app/platform/sales/quote" method="post">
        <input type="hidden" name="opportunity_id" value={opportunityId} />
        <input type="hidden" name="licensed_users" value={users} />
        <input type="hidden" name="monthly_value" value={monthly} />
        <input type="hidden" name="annual_value" value={annual} />
        <input type="hidden" name="quote_summary" value={summary} />
        <button className="h-11 w-full rounded-sm bg-blue px-4 text-sm font-bold text-white">Save quote to opportunity</button>
      </form>
      {currentValue !== null && <p className="text-[11.5px] text-ink-3">Current saved expected value: {money(currentValue)}</p>}
    </div>
  );
}
