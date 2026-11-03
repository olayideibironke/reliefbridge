import assert from "node:assert/strict";
import { isDuplicateQuoteError } from "./quote-intake-errors";

assert.equal(isDuplicateQuoteError(null), false);
assert.equal(isDuplicateQuoteError({code:"P0001",message:"A recent quote request has already been received"}), true);
assert.equal(isDuplicateQuoteError({code:"P0001",message:"Other application exception"}), false);
assert.equal(isDuplicateQuoteError({code:"23505",message:"A recent quote request has already been received"}), false);
assert.equal(isDuplicateQuoteError({code:"42501",message:"permission denied"}), false);
assert.equal(isDuplicateQuoteError({code:"P0001"}), false);
console.log("Quote intake error classification tests passed.");
