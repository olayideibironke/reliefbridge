import assert from "node:assert/strict";
import { validateQuoteForm } from "./quote-form-validation";

const fields: Record<string,string> = {
  first_name:"Jane",last_name:"Doe",work_email:" JANE@EXAMPLE.ORG ",
  organization_name:"Recovery Agency",role_title:"Director",
  package:"Recovery Growth",staff_count:"3",active_cases:"25",notes:"Written response please",
};
const make = (overrides: Record<string,string> = {}) => {
  const form = new FormData();
  for (const [key,value] of Object.entries({...fields,...overrides})) form.set(key,value);
  return form;
};
const valid = validateQuoteForm(make());
assert.deepEqual(valid.errors,{});
assert.equal(valid.payload.work_email,"jane@example.org");
assert.match(valid.payload.message,/Requested package: Recovery Growth/);
assert.match(valid.payload.message,/Active cases: 25/);
assert.equal(valid.payload.status,"New");
assert.equal(valid.payload.source,"Website");

for (const [key,value] of Object.entries({
  first_name:"",last_name:"",work_email:"invalid",
  organization_name:"x",role_title:"x",package:"Unapproved",
  staff_count:"1.5",active_cases:"-1",
})) {
  assert.ok(validateQuoteForm(make({[key]:value})).errors[key],key+" must be rejected");
}
assert.ok(validateQuoteForm(make({staff_count:"100001"})).errors.staff_count);
assert.ok(validateQuoteForm(make({active_cases:"10000001"})).errors.active_cases);
assert.ok(validateQuoteForm(make({notes:"a".repeat(1501)})).errors.notes);
assert.ok(validateQuoteForm(make({first_name:"Jane\u0000"})).errors.first_name);
assert.ok(validateQuoteForm(make({organization_name:"Agency\u007F"})).errors.organization_name);
assert.deepEqual(validateQuoteForm(make({active_cases:"0"})).errors,{});
console.log("Quote form validation and persistence payload tests passed.");
