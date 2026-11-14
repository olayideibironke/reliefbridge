/** Database SQLSTATE reserved for the quote-only cooldown guard. */
export const DUPLICATE_QUOTE_SQLSTATE = "RB001";

/** Recognize only the dedicated quote cooldown error, never arbitrary database errors. */
export function isDuplicateQuoteError(error: {code?: string; message?: string} | null): boolean {
  return error?.code === DUPLICATE_QUOTE_SQLSTATE;
}
