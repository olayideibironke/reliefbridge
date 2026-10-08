"use client";

import { useState } from "react";

export function SeatCheckoutForm({ initialUsers = 15 }: { initialUsers?: number }) {
  const [users, setUsers] = useState(String(Math.max(15, Math.min(500, initialUsers))));
  const parsed = Number(users);
  const valid = Number.isInteger(parsed) && parsed >= 15 && parsed <= 500;
  const total = valid ? 749 + (parsed - 15) * 49 : null;

  return (
    <form action="/api/billing/checkout" method="post">
      <label className="block text-sm font-semibold text-navy" htmlFor="licensed_users">Total licensed organizational users</label>
      <p className="mt-1 text-sm text-ink-2">15 users are included for $749/month. Each additional user is $49/month. You can change this before completing payment.</p>
      <input id="licensed_users" name="licensed_users" type="number" min="15" max="500" step="1" value={users} onChange={(event) => setUsers(event.target.value)} className="mt-3 w-32 rounded-md border border-line bg-white px-3 py-2 text-sm text-navy" required />
      <div aria-live="polite" className="mt-4 rounded-md border border-line bg-surface-2 p-4">
        {valid ? (
          <>
            <p className="text-sm text-ink-2">Base subscription (15 users): $749/month</p>
            <p className="mt-1 text-sm text-ink-2">Additional users ({parsed - 15} × $49): ${((parsed - 15) * 49).toLocaleString("en-US")}/month</p>
            <p className="mt-2 text-lg font-bold text-navy">Total: ${total?.toLocaleString("en-US")}/month</p>
          </>
        ) : <p className="text-sm text-red">Enter a whole number between 15 and 500.</p>}
      </div>
      <div className="mt-5"><button disabled={!valid} className="rounded-md bg-navy px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" type="submit">Continue to secure checkout</button></div>
    </form>
  );
}
