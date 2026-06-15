"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { requestDemoAction } from "./actions";
import type { FormState } from "@/lib/forms";

const initialState: FormState = {
  ok: false,
  message: null,
};

const ORGANIZATION_TYPES = [
  "Long-Term Recovery Group",
  "VOAD or COAD",
  "Nonprofit",
  "Faith-Based Organization",
  "Government Agency",
  "Legal Aid Organization",
  "Housing or Repair Organization",
  "Healthcare Organization",
  "Foundation or Funder",
  "Other",
];

const ORGANIZATION_SIZES = [
  "1–10",
  "11–25",
  "26–50",
  "51–100",
  "101–250",
  "251+",
];

const RECOVERY_FOCUSES = [
  "Survivor case management",
  "Partner referrals",
  "Unmet needs coordination",
  "Disaster recovery reporting",
  "Volunteer and resource coordination",
  "Multiple recovery operations",
  "Other",
];

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
];

type FieldProps = {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
};

function Field({
  label,
  name,
  required = false,
  error,
  children,
}: FieldProps) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={name}
        className="mb-2 block text-[13px] font-bold text-navy"
      >
        {label}
        {required && <span className="ml-1 text-red">*</span>}
      </label>

      {children}

      {error && (
        <p className="mt-1.5 text-[12.5px] font-medium text-red">
          {error}
        </p>
      )}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-blue px-6 text-[15px] font-bold text-white shadow-sm transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending ? (
        <>
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
            aria-hidden="true"
          />
          Submitting request…
        </>
      ) : (
        <>
          Request my ReliefBridge demo
          <span aria-hidden="true">→</span>
        </>
      )}
    </button>
  );
}

function SuccessState({ message }: { message: string | null }) {
  return (
    <div className="overflow-hidden rounded-md border border-green/30 bg-white shadow-lift">
      <div className="border-b border-green/20 bg-green/10 px-6 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-green text-white">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m5 12 4 4L19 6" />
            </svg>
          </span>

          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-green">
              Request received
            </div>

            <h2 className="mt-1 text-[24px] font-black tracking-tight text-navy">
              Thank you for contacting ReliefBridge.
            </h2>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-6 py-7 sm:px-8 sm:py-8">
        <p className="text-[15.5px] leading-7 text-ink-2">
          {message ??
            "Your request has been received. A ReliefBridge representative will contact you shortly."}
        </p>

        <div className="rounded-sm border border-line bg-surface-2 px-5 py-4">
          <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink-3">
            What happens next
          </div>

          <p className="mt-2 text-[14px] leading-6 text-ink-2">
            Our team will review your organization&apos;s recovery coordination
            needs and follow up using your preferred contact method.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-sm bg-navy px-5 text-[14px] font-bold text-white hover:bg-navy-light hover:no-underline"
          >
            Return to ReliefBridge
          </Link>

          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-sm border border-line bg-white px-5 text-[14px] font-bold text-navy hover:border-blue hover:text-blue hover:no-underline"
          >
            Sign in to the platform
          </Link>
        </div>
      </div>
    </div>
  );
}

export function DemoRequestForm() {
  const [state, formAction] = useActionState(
    requestDemoAction,
    initialState
  );

  if (state.ok) {
    return <SuccessState message={state.message} />;
  }

  const inputClass =
    "rb-demo-control h-12 w-full rounded-sm border border-line bg-white px-3.5 text-[14px] outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/10";

  const textareaClass =
    "rb-demo-control min-h-32 w-full resize-y rounded-sm border border-line bg-white px-3.5 py-3 text-[14px] leading-6 outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/10";

  const selectClass =
    "rb-demo-control h-12 w-full rounded-sm border border-line bg-white px-3.5 text-[14px] outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/10";

  return (
    <form
      action={formAction}
      className="overflow-hidden rounded-md border border-line bg-white text-[#102A43] shadow-lift"
      noValidate
    >
      <style jsx global>{`
        .rb-demo-control {
          color: #102a43 !important;
          -webkit-text-fill-color: #102a43 !important;
          caret-color: #102a43 !important;
          background-color: #ffffff !important;
          opacity: 1 !important;
          color-scheme: light !important;
        }

        .rb-demo-control::placeholder {
          color: #6b7b8e !important;
          -webkit-text-fill-color: #6b7b8e !important;
          opacity: 1 !important;
        }

        .rb-demo-control:focus {
          color: #102a43 !important;
          -webkit-text-fill-color: #102a43 !important;
          caret-color: #102a43 !important;
        }

        .rb-demo-control option {
          color: #102a43 !important;
          -webkit-text-fill-color: #102a43 !important;
          background-color: #ffffff !important;
        }

        .rb-demo-control:-webkit-autofill,
        .rb-demo-control:-webkit-autofill:hover,
        .rb-demo-control:-webkit-autofill:focus,
        .rb-demo-control:-webkit-autofill:active {
          -webkit-text-fill-color: #102a43 !important;
          caret-color: #102a43 !important;
          box-shadow: 0 0 0 1000px #ffffff inset !important;
          -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
          transition: background-color 9999s ease-out 0s;
        }
      `}</style>

      <div className="border-b border-line bg-surface-2 px-5 py-5 sm:px-8">
        <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-blue">
          Organization information
        </div>

        <h2 className="mt-2 text-[24px] font-black tracking-tight text-navy">
          Tell us about your recovery operations.
        </h2>

        <p className="mt-2 text-[14px] leading-6 text-ink-2">
          Fields marked with an asterisk are required.
        </p>
      </div>

      <div className="space-y-8 px-5 py-6 sm:px-8 sm:py-8">
        {state.message && !state.ok && (
          <div
            role="alert"
            className="rounded-sm border border-red/25 bg-red/5 px-4 py-3 text-[13.5px] font-medium text-red"
          >
            {state.message}
          </div>
        )}

        <div
          className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
          aria-hidden="true"
        >
          <label htmlFor="website">Website</label>

          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <section>
          <div className="mb-5 border-b border-line pb-3">
            <h3 className="text-[16px] font-bold text-navy">
              Contact details
            </h3>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="First name"
              name="first_name"
              required
              error={state.fieldErrors?.first_name}
            >
              <input
                id="first_name"
                name="first_name"
                type="text"
                autoComplete="given-name"
                maxLength={80}
                required
                className={inputClass}
                placeholder="First name"
              />
            </Field>

            <Field
              label="Last name"
              name="last_name"
              required
              error={state.fieldErrors?.last_name}
            >
              <input
                id="last_name"
                name="last_name"
                type="text"
                autoComplete="family-name"
                maxLength={80}
                required
                className={inputClass}
                placeholder="Last name"
              />
            </Field>

            <Field
              label="Work email"
              name="work_email"
              required
              error={state.fieldErrors?.work_email}
            >
              <input
                id="work_email"
                name="work_email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                className={inputClass}
                placeholder="name@organization.org"
              />
            </Field>

            <Field
              label="Phone number"
              name="phone"
              error={state.fieldErrors?.phone}
            >
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={40}
                className={inputClass}
                placeholder="(301) 555-0123"
              />
            </Field>

            <Field
              label="Role or job title"
              name="role_title"
              required
              error={state.fieldErrors?.role_title}
            >
              <input
                id="role_title"
                name="role_title"
                type="text"
                autoComplete="organization-title"
                maxLength={120}
                required
                className={inputClass}
                placeholder="Recovery Director"
              />
            </Field>

            <Field
              label="Preferred contact method"
              name="preferred_contact"
              required
              error={state.fieldErrors?.preferred_contact}
            >
              <select
                id="preferred_contact"
                name="preferred_contact"
                required
                defaultValue="Email"
                className={selectClass}
              >
                <option value="Email">Email</option>
                <option value="Phone">Phone</option>
              </select>
            </Field>
          </div>
        </section>

        <section>
          <div className="mb-5 border-b border-line pb-3">
            <h3 className="text-[16px] font-bold text-navy">
              Organization profile
            </h3>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Organization name"
              name="organization_name"
              required
              error={state.fieldErrors?.organization_name}
            >
              <input
                id="organization_name"
                name="organization_name"
                type="text"
                autoComplete="organization"
                maxLength={180}
                required
                className={inputClass}
                placeholder="Organization name"
              />
            </Field>

            <Field
              label="Organization type"
              name="organization_type"
              required
              error={state.fieldErrors?.organization_type}
            >
              <select
                id="organization_type"
                name="organization_type"
                required
                defaultValue=""
                className={selectClass}
              >
                <option value="" disabled>
                  Select organization type
                </option>

                {ORGANIZATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="State"
              name="state"
              error={state.fieldErrors?.state}
            >
              <select
                id="state"
                name="state"
                defaultValue=""
                className={selectClass}
              >
                <option value="">Select state</option>

                {US_STATES.map((stateCode) => (
                  <option key={stateCode} value={stateCode}>
                    {stateCode}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Organization size"
              name="organization_size"
              error={state.fieldErrors?.organization_size}
            >
              <select
                id="organization_size"
                name="organization_size"
                defaultValue=""
                className={selectClass}
              >
                <option value="">Select team size</option>

                {ORGANIZATION_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} employees
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <section>
          <div className="mb-5 border-b border-line pb-3">
            <h3 className="text-[16px] font-bold text-navy">
              Recovery coordination needs
            </h3>
          </div>

          <div className="grid gap-5">
            <Field
              label="Primary area of interest"
              name="recovery_focus"
              error={state.fieldErrors?.recovery_focus}
            >
              <select
                id="recovery_focus"
                name="recovery_focus"
                defaultValue=""
                className={selectClass}
              >
                <option value="">Select your primary focus</option>

                {RECOVERY_FOCUSES.map((focus) => (
                  <option key={focus} value={focus}>
                    {focus}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="How can ReliefBridge help your organization?"
              name="message"
              error={state.fieldErrors?.message}
            >
              <textarea
                id="message"
                name="message"
                maxLength={2000}
                className={textareaClass}
                placeholder="Tell us about your current workflow, partner network, reporting needs, or coordination challenges."
              />
            </Field>
          </div>
        </section>

        <div className="rounded-sm border border-line bg-surface-2 px-4 py-4">
          <div className="flex items-start gap-3">
            <svg
              viewBox="0 0 24 24"
              className="mt-0.5 h-5 w-5 shrink-0 text-blue"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="5" y="10" width="14" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>

            <p className="text-[12.5px] leading-5 text-ink-2">
              Your information will be used only to respond to this request
              and discuss ReliefBridge with your organization. We do not sell
              contact information.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] leading-5 text-ink-3">
            By submitting this form, you agree to be contacted about
            ReliefBridge.
          </p>

          <SubmitButton />
        </div>
      </div>
    </form>
  );
}