/** Safe classification of errors returned from the quote intake insert. */
export function isDuplicateQuoteError(error: {code?: string; message?: string} | null): boolean {
  return error?.code === "P0001" &&
    typeof error.message === "string" &&
    error.message.includes("A recent quote request has already been received");
}
