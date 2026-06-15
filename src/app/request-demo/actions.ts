"use server";

import { Resend } from "resend";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isEmail } from "@/lib/utils";
import { US_STATES } from "@/lib/constants";
import type { FormState } from "@/lib/forms";

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
] as const;

const ORGANIZATION_SIZES = [
  "1–10",
  "11–25",
  "26–50",
  "51–100",
  "101–250",
  "251+",
] as const;

const RECOVERY_FOCUSES = [
  "Survivor case management",
  "Partner referrals",
  "Unmet needs coordination",
  "Disaster recovery reporting",
  "Volunteer and resource coordination",
  "Multiple recovery operations",
  "Other",
] as const;

const PREFERRED_CONTACT_METHODS = ["Email", "Phone"] as const;

type DemoRequestDetails = {
  firstName: string;
  lastName: string;
  workEmail: string;
  phone: string;
  organizationName: string;
  organizationType: string;
  roleTitle: string;
  state: string;
  organizationSize: string;
  recoveryFocus: string;
  preferredContact: string;
  message: string;
};

type EmailConfiguration = {
  resend: Resend;
  fromEmail: string;
  notificationEmail: string;
};

function readString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function isAllowedValue<T extends readonly string[]>(
  values: T,
  value: string
): value is T[number] {
  return values.includes(value as T[number]);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function displayValue(value: string): string {
  return value ? escapeHtml(value) : "Not provided";
}

function displayMultilineValue(value: string): string {
  return value
    ? escapeHtml(value).replace(/\r?\n/g, "<br />")
    : "Not provided";
}

function getEmailConfiguration(): EmailConfiguration | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
  const notificationEmail =
    process.env.RELIEFBRIDGE_DEMO_NOTIFY_EMAIL?.trim();

  if (!apiKey || !fromEmail || !notificationEmail) {
    console.error(
      "ReliefBridge email configuration is incomplete. Required variables: RESEND_API_KEY, RESEND_FROM_EMAIL, RELIEFBRIDGE_DEMO_NOTIFY_EMAIL."
    );

    return null;
  }

  return {
    resend: new Resend(apiKey),
    fromEmail,
    notificationEmail,
  };
}

function buildAdminEmailHtml(details: DemoRequestDetails): string {
  const submittedAt = new Date().toISOString();

  const rows = [
    ["Name", `${details.firstName} ${details.lastName}`],
    ["Work email", details.workEmail],
    ["Phone", details.phone],
    ["Role or job title", details.roleTitle],
    ["Preferred contact", details.preferredContact],
    ["Organization", details.organizationName],
    ["Organization type", details.organizationType],
    ["State", details.state],
    ["Organization size", details.organizationSize],
    ["Primary focus", details.recoveryFocus],
  ];

  const tableRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td
            style="
              width: 190px;
              padding: 12px 14px;
              border-bottom: 1px solid #d8e0e8;
              color: #526579;
              font-size: 13px;
              font-weight: 700;
              vertical-align: top;
            "
          >
            ${escapeHtml(label)}
          </td>

          <td
            style="
              padding: 12px 14px;
              border-bottom: 1px solid #d8e0e8;
              color: #102a43;
              font-size: 14px;
              line-height: 1.55;
              vertical-align: top;
            "
          >
            ${displayValue(value)}
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>New ReliefBridge demo request</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background: #eef3f7;
          font-family: Arial, Helvetica, sans-serif;
        "
      >
        <div style="padding: 28px 14px;">
          <div
            style="
              max-width: 720px;
              margin: 0 auto;
              overflow: hidden;
              border: 1px solid #d8e0e8;
              border-radius: 10px;
              background: #ffffff;
            "
          >
            <div
              style="
                padding: 26px 30px;
                background: #082a4a;
                color: #ffffff;
              "
            >
              <div
                style="
                  color: #ffbf2f;
                  font-size: 12px;
                  font-weight: 800;
                  letter-spacing: 1.5px;
                  text-transform: uppercase;
                "
              >
                New website inquiry
              </div>

              <h1
                style="
                  margin: 9px 0 0;
                  font-size: 27px;
                  line-height: 1.2;
                "
              >
                ReliefBridge demo request
              </h1>

              <p
                style="
                  margin: 10px 0 0;
                  color: #dce8f2;
                  font-size: 14px;
                  line-height: 1.6;
                "
              >
                A new organization submitted the public demo-request form.
              </p>
            </div>

            <div style="padding: 26px 30px;">
              <div
                style="
                  margin-bottom: 18px;
                  padding: 14px 16px;
                  border-left: 4px solid #ffbf2f;
                  background: #f6f9fb;
                  color: #102a43;
                  font-size: 14px;
                  line-height: 1.6;
                "
              >
                Reply directly to this email to contact
                <strong>
                  ${escapeHtml(details.firstName)} ${escapeHtml(details.lastName)}
                </strong>
                at ${escapeHtml(details.workEmail)}.
              </div>

              <table
                role="presentation"
                cellpadding="0"
                cellspacing="0"
                style="
                  width: 100%;
                  border-collapse: collapse;
                  border: 1px solid #d8e0e8;
                "
              >
                ${tableRows}
              </table>

              <div
                style="
                  margin-top: 24px;
                  color: #526579;
                  font-size: 12px;
                  font-weight: 800;
                  letter-spacing: 1.2px;
                  text-transform: uppercase;
                "
              >
                Organization message
              </div>

              <div
                style="
                  margin-top: 9px;
                  padding: 16px;
                  border: 1px solid #d8e0e8;
                  border-radius: 6px;
                  background: #f8fafc;
                  color: #102a43;
                  font-size: 14px;
                  line-height: 1.7;
                "
              >
                ${displayMultilineValue(details.message)}
              </div>

              <p
                style="
                  margin: 22px 0 0;
                  color: #718096;
                  font-size: 12px;
                  line-height: 1.6;
                "
              >
                Submitted at ${escapeHtml(submittedAt)}. The complete record is
                also stored in the ReliefBridge Supabase
                <strong>demo_requests</strong> table.
              </p>
            </div>

            <div
              style="
                padding: 18px 30px;
                background: #f4f7fa;
                color: #526579;
                font-size: 12px;
                line-height: 1.6;
              "
            >
              ReliefBridge · Disaster Recovery Coordination<br />
              A Westforge Holdings platform
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildAdminEmailText(details: DemoRequestDetails): string {
  return [
    "NEW RELIEFBRIDGE DEMO REQUEST",
    "",
    `Name: ${details.firstName} ${details.lastName}`,
    `Work email: ${details.workEmail}`,
    `Phone: ${details.phone || "Not provided"}`,
    `Role or job title: ${details.roleTitle}`,
    `Preferred contact: ${details.preferredContact}`,
    `Organization: ${details.organizationName}`,
    `Organization type: ${details.organizationType}`,
    `State: ${details.state || "Not provided"}`,
    `Organization size: ${details.organizationSize || "Not provided"}`,
    `Primary focus: ${details.recoveryFocus || "Not provided"}`,
    "",
    "Organization message:",
    details.message || "Not provided",
    "",
    `Submitted at: ${new Date().toISOString()}`,
    "",
    "Reply directly to this email to contact the requester.",
  ].join("\n");
}

function buildConfirmationEmailHtml(
  details: DemoRequestDetails
): string {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>ReliefBridge demo request received</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background: #eef3f7;
          font-family: Arial, Helvetica, sans-serif;
        "
      >
        <div style="padding: 28px 14px;">
          <div
            style="
              max-width: 650px;
              margin: 0 auto;
              overflow: hidden;
              border: 1px solid #d8e0e8;
              border-radius: 10px;
              background: #ffffff;
            "
          >
            <div
              style="
                padding: 28px 30px;
                background: #082a4a;
                color: #ffffff;
              "
            >
              <div
                style="
                  color: #ffbf2f;
                  font-size: 12px;
                  font-weight: 800;
                  letter-spacing: 1.5px;
                  text-transform: uppercase;
                "
              >
                ReliefBridge
              </div>

              <h1
                style="
                  margin: 9px 0 0;
                  font-size: 28px;
                  line-height: 1.25;
                "
              >
                Your demo request has been received.
              </h1>
            </div>

            <div style="padding: 30px;">
              <p
                style="
                  margin: 0;
                  color: #102a43;
                  font-size: 16px;
                  line-height: 1.7;
                "
              >
                Hello ${escapeHtml(details.firstName)},
              </p>

              <p
                style="
                  margin: 18px 0 0;
                  color: #40566d;
                  font-size: 15px;
                  line-height: 1.75;
                "
              >
                Thank you for requesting a personalized ReliefBridge
                demonstration for
                <strong>${escapeHtml(details.organizationName)}</strong>.
                Our team will review your organization&apos;s recovery
                coordination needs and follow up using your preferred contact
                method:
                <strong>${escapeHtml(details.preferredContact)}</strong>.
              </p>

              <div
                style="
                  margin-top: 24px;
                  padding: 18px;
                  border-left: 4px solid #ffbf2f;
                  background: #f5f8fb;
                "
              >
                <div
                  style="
                    color: #082a4a;
                    font-size: 13px;
                    font-weight: 800;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                  "
                >
                  What happens next
                </div>

                <ol
                  style="
                    margin: 12px 0 0;
                    padding-left: 20px;
                    color: #40566d;
                    font-size: 14px;
                    line-height: 1.8;
                  "
                >
                  <li>We review your organization and coordination priorities.</li>
                  <li>Our team contacts you directly.</li>
                  <li>We tailor the walkthrough to your recovery workflow.</li>
                </ol>
              </div>

              <p
                style="
                  margin: 24px 0 0;
                  color: #40566d;
                  font-size: 14px;
                  line-height: 1.7;
                "
              >
                You can reply to this email if you need to add information
                before our team follows up.
              </p>

              <div style="margin-top: 28px;">
                <a
                  href="https://reliefbridge.net"
                  style="
                    display: inline-block;
                    padding: 13px 20px;
                    border-radius: 4px;
                    background: #0b69a3;
                    color: #ffffff;
                    font-size: 14px;
                    font-weight: 700;
                    text-decoration: none;
                  "
                >
                  Visit ReliefBridge
                </a>
              </div>

              <p
                style="
                  margin: 30px 0 0;
                  color: #526579;
                  font-size: 13px;
                  line-height: 1.7;
                "
              >
                ReliefBridge Team<br />
                Disaster Recovery Coordination<br />
                A Westforge Holdings platform
              </p>
            </div>

            <div
              style="
                padding: 18px 30px;
                background: #f4f7fa;
                color: #718096;
                font-size: 11.5px;
                line-height: 1.6;
              "
            >
              This message was sent because a demo request was submitted using
              ${escapeHtml(details.workEmail)} at reliefbridge.net.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildConfirmationEmailText(
  details: DemoRequestDetails
): string {
  return [
    `Hello ${details.firstName},`,
    "",
    "Thank you for requesting a personalized ReliefBridge demonstration.",
    "",
    `Organization: ${details.organizationName}`,
    `Preferred contact method: ${details.preferredContact}`,
    "",
    "What happens next:",
    "1. We review your organization and coordination priorities.",
    "2. Our team contacts you directly.",
    "3. We tailor the walkthrough to your recovery workflow.",
    "",
    "You can reply to this email if you need to add information.",
    "",
    "ReliefBridge Team",
    "Disaster Recovery Coordination",
    "A Westforge Holdings platform",
    "",
    "https://reliefbridge.net",
  ].join("\n");
}

async function sendDemoRequestEmails(
  details: DemoRequestDetails
): Promise<{
  adminSent: boolean;
  confirmationSent: boolean;
}> {
  const configuration = getEmailConfiguration();

  if (!configuration) {
    return {
      adminSent: false,
      confirmationSent: false,
    };
  }

  const { resend, fromEmail, notificationEmail } = configuration;

  try {
    const [adminResult, confirmationResult] = await Promise.all([
      resend.emails.send({
        from: fromEmail,
        to: [notificationEmail],
        replyTo: details.workEmail,
        subject: `New ReliefBridge demo request — ${details.organizationName}`,
        html: buildAdminEmailHtml(details),
        text: buildAdminEmailText(details),
        tags: [
          {
            name: "category",
            value: "demo_request",
          },
          {
            name: "audience",
            value: "internal",
          },
        ],
      }),

      resend.emails.send({
        from: fromEmail,
        to: [details.workEmail],
        replyTo: notificationEmail,
        subject: "We received your ReliefBridge demo request",
        html: buildConfirmationEmailHtml(details),
        text: buildConfirmationEmailText(details),
        tags: [
          {
            name: "category",
            value: "demo_request",
          },
          {
            name: "audience",
            value: "requester",
          },
        ],
      }),
    ]);

    if (adminResult.error) {
      console.error(
        "ReliefBridge admin demo notification failed:",
        adminResult.error
      );
    }

    if (confirmationResult.error) {
      console.error(
        "ReliefBridge requester confirmation failed:",
        confirmationResult.error
      );
    }

    return {
      adminSent: !adminResult.error,
      confirmationSent: !confirmationResult.error,
    };
  } catch (error) {
    console.error(
      "ReliefBridge demo request email delivery threw an exception:",
      error
    );

    return {
      adminSent: false,
      confirmationSent: false,
    };
  }
}

export async function requestDemoAction(
  _previousState: FormState,
  formData: FormData
): Promise<FormState> {
  const firstName = readString(formData.get("first_name"));
  const lastName = readString(formData.get("last_name"));
  const workEmail = readString(formData.get("work_email")).toLowerCase();
  const phone = readString(formData.get("phone"));
  const organizationName = readString(
    formData.get("organization_name")
  );
  const organizationType = readString(
    formData.get("organization_type")
  );
  const roleTitle = readString(formData.get("role_title"));
  const state = readString(formData.get("state")).toUpperCase();
  const organizationSize = readString(
    formData.get("organization_size")
  );
  const recoveryFocus = readString(
    formData.get("recovery_focus")
  );
  const preferredContact = readString(
    formData.get("preferred_contact")
  );
  const message = readString(formData.get("message"));

  /*
   * Honeypot field. Real visitors never see or complete this field.
   * Return a normal success response so automated bots receive no clues.
   */
  const website = readString(formData.get("website"));

  if (website) {
    return {
      ok: true,
      message:
        "Thank you. Your request has been received and our team will follow up shortly.",
    };
  }

  const fieldErrors: Record<string, string> = {};

  if (!firstName) {
    fieldErrors.first_name = "Enter your first name.";
  } else if (firstName.length > 80) {
    fieldErrors.first_name =
      "First name must be 80 characters or fewer.";
  }

  if (!lastName) {
    fieldErrors.last_name = "Enter your last name.";
  } else if (lastName.length > 80) {
    fieldErrors.last_name =
      "Last name must be 80 characters or fewer.";
  }

  if (!workEmail) {
    fieldErrors.work_email = "Enter your work email.";
  } else if (!isEmail(workEmail)) {
    fieldErrors.work_email = "Enter a valid email address.";
  } else if (workEmail.length > 254) {
    fieldErrors.work_email = "Email address is too long.";
  }

  if (phone.length > 40) {
    fieldErrors.phone =
      "Phone number must be 40 characters or fewer.";
  }

  if (!organizationName) {
    fieldErrors.organization_name =
      "Enter your organization name.";
  } else if (
    organizationName.length < 2 ||
    organizationName.length > 180
  ) {
    fieldErrors.organization_name =
      "Organization name must be between 2 and 180 characters.";
  }

  if (
    !organizationType ||
    !isAllowedValue(
      ORGANIZATION_TYPES,
      organizationType
    )
  ) {
    fieldErrors.organization_type =
      "Select an organization type.";
  }

  if (!roleTitle) {
    fieldErrors.role_title =
      "Enter your role or job title.";
  } else if (
    roleTitle.length < 2 ||
    roleTitle.length > 120
  ) {
    fieldErrors.role_title =
      "Role or job title must be between 2 and 120 characters.";
  }

  if (state && !US_STATES.includes(state)) {
    fieldErrors.state = "Select a valid state.";
  }

  if (
    organizationSize &&
    !isAllowedValue(
      ORGANIZATION_SIZES,
      organizationSize
    )
  ) {
    fieldErrors.organization_size =
      "Select a valid organization size.";
  }

  if (
    recoveryFocus &&
    !isAllowedValue(
      RECOVERY_FOCUSES,
      recoveryFocus
    )
  ) {
    fieldErrors.recovery_focus =
      "Select a valid recovery focus.";
  }

  if (
    !preferredContact ||
    !isAllowedValue(
      PREFERRED_CONTACT_METHODS,
      preferredContact
    )
  ) {
    fieldErrors.preferred_contact =
      "Select a preferred contact method.";
  }

  if (message.length > 2000) {
    fieldErrors.message =
      "Message must be 2,000 characters or fewer.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors,
    };
  }

  const requestDetails: DemoRequestDetails = {
    firstName,
    lastName,
    workEmail,
    phone,
    organizationName,
    organizationType,
    roleTitle,
    state,
    organizationSize,
    recoveryFocus,
    preferredContact,
    message,
  };

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("demo_requests")
    .insert({
      first_name: firstName,
      last_name: lastName,
      work_email: workEmail,
      phone: phone || null,
      organization_name: organizationName,
      organization_type: organizationType,
      role_title: roleTitle,
      state: state || null,
      organization_size: organizationSize || null,
      recovery_focus: recoveryFocus || null,
      preferred_contact: preferredContact,
      message: message || null,
      status: "New",
      source: "Website",
    });

  if (error) {
    console.error(
      "ReliefBridge demo request submission failed:",
      error
    );

    return {
      ok: false,
      message:
        "We could not submit your request right now. Please try again in a moment.",
    };
  }

  const emailStatus =
    await sendDemoRequestEmails(requestDetails);

  if (
    emailStatus.adminSent &&
    emailStatus.confirmationSent
  ) {
    return {
      ok: true,
      message:
        "Your demo request has been received. A confirmation email is on its way, and a ReliefBridge representative will contact you shortly.",
    };
  }

  if (emailStatus.adminSent) {
    return {
      ok: true,
      message:
        "Your demo request has been received and our team has been notified. We could not send the confirmation email, but a ReliefBridge representative will still contact you.",
    };
  }

  if (emailStatus.confirmationSent) {
    return {
      ok: true,
      message:
        "Your demo request has been saved and a confirmation email is on its way. Our team can review your request securely in ReliefBridge.",
    };
  }

  return {
    ok: true,
    message:
      "Your demo request has been saved successfully. Email delivery is temporarily unavailable, but our team can still review your request securely.",
  };
}