export type FormState = {
  ok: boolean;
  message: string | null;
  fieldErrors?: Record<string, string>;
};

export const initialFormState: FormState = { ok: false, message: null };
