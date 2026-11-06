import assert from "node:assert/strict";
import { DUPLICATE_QUOTE_SQLSTATE, isDuplicateQuoteError } from "./quote-intake-errors";

assert.equal(DUPLICATE_QUOTE_SQLSTATE,"RB001");
assert.equal(isDuplicateQuoteError(null),false);
assert.equal(isDuplicateQuoteError({code:"RB001"}),true);
assert.equal(isDuplicateQuoteError({code:"RB001",message:"localized or changed text"}),true);
assert.equal(isDuplicateQuoteError({code:"P0001",message:"A recent quote request has already been received"}),false);
assert.equal(isDuplicateQuoteError({code:"23505",message:"A recent quote request has already been received"}),false);
assert.equal(isDuplicateQuoteError({code:"42501",message:"permission denied"}),false);
assert.equal(isDuplicateQuoteError({message:"A recent quote request has already been received"}),false);
console.log("Quote intake error classification tests passed.");
