"use server";

import { persistPublicIntake } from "@/lib/public-intake";
import { validateQuoteForm } from "@/lib/quote-form-validation";

export type QuoteState = { ok: boolean; message: string; errors?: Record<string,string> };

export async function requestQuoteAction(_previous: QuoteState, form: FormData): Promise<QuoteState> {
  // Honeypot: silently discard automated submissions.
  if (typeof form.get("website") === "string" && String(form.get("website")).trim()) {
    return {ok:true,message:"Thank you. Your inquiry has been received."};
  }

  const {errors, payload} = validateQuoteForm(form);
  if (Object.keys(errors).length) {
    return {ok:false,message:"Please correct the highlighted fields.",errors};
  }

  try {
    const result = await persistPublicIntake(payload);
    if (!result.ok) {
      if (result.reason === "duplicate") {
        return {ok:true,message:"We recently received a quote request from your organization. There is no need to submit it again right now. Our team will review it and respond by email."};
      }
      if (result.reason === "limited") return {ok:false,message:"We have received several recent requests. Please try again later or contact our team by email."};
      return {ok:false,message:"We could not save your request. Please try again."};
    }
    return {ok:true,message:"Your quote request has been saved. Our team will review your organization’s needs and follow up by email. No call is required."};
  } catch {
    console.error("Quote request persistence unavailable");
    return {ok:false,message:"We could not save your request. Please try again."};
  }
}
