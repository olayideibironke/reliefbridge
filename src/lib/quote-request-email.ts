import "server-only";

import { Resend } from "resend";
import type { validateQuoteForm } from "./quote-form-validation";

type ValidatedQuote = ReturnType<typeof validateQuoteForm>;
type QuoteContact = Pick<
  ValidatedQuote["payload"],
  "first_name" | "last_name" | "work_email" | "organization_name" | "role_title"
>;

const notificationEmail = "connect@reliefbridge.net";
const pipelineUrl = "https://reliefbridge.net/app/platform/sales?stage=Quote%2FProposal";

export async function sendQuoteRequestEmails(
  contact: QuoteContact,
  quote: ValidatedQuote["quote"],
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    console.error("ReliefBridge quote notification email configuration is incomplete.");
    return;
  }

  const resend = new Resend(apiKey);
  const notifications = [
    {
      audience: "internal",
      to: notificationEmail,
      replyTo: contact.work_email,
      subject: "New ReliefBridge quote request",
      text: [
        "A new quote request was submitted on ReliefBridge.",
        "",
        `Name: ${contact.first_name} ${contact.last_name}`,
        `Organization: ${contact.organization_name}`,
        `Work email: ${contact.work_email}`,
        `Role: ${contact.role_title}`,
        `Selected package: ${quote.packageName}`,
        `Organizational staff count: ${quote.staffCount}`,
        `Active cases: ${quote.activeCases}`,
        "",
        "Optional message:",
        quote.notes || "Not provided",
        "",
        `Sales Pipeline: ${pipelineUrl}`,
      ].join("\n"),
    },
    {
      audience: "requester",
      to: contact.work_email,
      replyTo: notificationEmail,
      subject: "We received your ReliefBridge quote request",
      text: [
        `Hello ${contact.first_name},`,
        "",
        `We received the quote request for ${contact.organization_name}.`,
        `Selected package: ${quote.packageName}`,
        "",
        "Our team will review your organization's requirements and follow up by email.",
        "",
        "ReliefBridge Team",
      ].join("\n"),
    },
  ];

  await Promise.all(notifications.map(async ({ audience, ...message }) => {
    try {
      const { error } = await resend.emails.send({
        ...message,
        from,
        tags: [
          { name: "category", value: "quote_request" },
          { name: "audience", value: audience },
        ],
      });

      if (error) {
        console.error(`ReliefBridge quote notification rejected by email provider (${audience}).`);
      }
    } catch {
      console.error(`ReliefBridge quote notification delivery failed (${audience}).`);
    }
  }));
}
