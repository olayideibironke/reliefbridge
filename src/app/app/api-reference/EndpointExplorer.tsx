"use client";

import { useState } from "react";

type ApiEndpoint = {
  method: string;
  path: string;
  purpose: string;
  access: string;
  request: string;
  responses: string;
  notes: string;
};

export function EndpointExplorer({ endpoints }: { endpoints: ApiEndpoint[] }) {
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const matching = endpoints.filter((item) =>
    [item.method, item.path, item.purpose].some((value) =>
      value.toLowerCase().includes(filter.toLowerCase().trim())
    )
  );

  return (
    <section className="space-y-4" aria-label="Documented endpoints">
      <label className="block space-y-2 text-sm font-medium">
        <span>Find an endpoint</span>
        <input
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Search by path, method, or purpose"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
        />
      </label>
      <p className="text-xs text-slate-500">{matching.length} documented endpoint{matching.length === 1 ? "" : "s"} found. Read-only explorer: no API requests are executed.</p>
      {matching.map((endpoint) => {
        const key = endpoint.method + " " + endpoint.path;
        const open = expanded.includes(key);
        return (
          <article key={key} className="rounded-xl border border-slate-200">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setExpanded((previous) =>
                previous.includes(key) ? previous.filter((value) => value !== key) : [...previous, key]
              )}
              className="flex w-full flex-wrap items-center gap-3 p-5 text-left"
            >
              <span className="rounded bg-teal-100 px-2 py-1 text-xs font-bold text-teal-900">{endpoint.method}</span>
              <code className="break-all text-sm font-semibold">{endpoint.path}</code>
              <span className="ml-auto text-xs text-slate-500">{open ? "Hide details" : "View details"}</span>
            </button>
            {open && (
              <div className="space-y-4 border-t border-slate-200 p-5">
                <p className="text-sm">{endpoint.purpose}</p>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="font-semibold">Authorization</dt><dd className="text-slate-600">{endpoint.access}</dd></div>
                  <div><dt className="font-semibold">Request</dt><dd className="text-slate-600">{endpoint.request}</dd></div>
                  <div><dt className="font-semibold">Responses</dt><dd className="text-slate-600">{endpoint.responses}</dd></div>
                  <div><dt className="font-semibold">Operational notes</dt><dd className="text-slate-600">{endpoint.notes}</dd></div>
                </dl>
              </div>
            )}
          </article>
        );
      })}
      {matching.length === 0 && <p className="text-sm text-slate-600">No documented endpoints match your search.</p>}
    </section>
  );
}
