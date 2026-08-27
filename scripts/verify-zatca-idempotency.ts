import assert from "node:assert/strict";
import { orchestrateZatcaInvoice } from "../server/zatca/idempotency";

let signs = 0, submissions = 0, retries = 0;
let status: any = undefined;
const sign = async () => {
  signs++; submissions++;
  status = { submissionStatus: "pending", signedXml: "<signed/>", invoiceHash: "hash", invoiceCounter: 1 };
  return { success: true, submissionStatus: "pending" };
};
const retry = async () => { retries++; submissions++; return { success: true, submissionStatus: "reported" }; };
let tail = Promise.resolve();
const request = async () => {
  const previous = tail;
  let release!: () => void;
  tail = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try { return await orchestrateZatcaInvoice(status, sign, retry); } finally { release(); }
};
await Promise.all([request(), request()]);
assert.equal(signs, 1);
assert.equal(submissions, 1);
assert.equal(retries, 0);
await orchestrateZatcaInvoice(status, sign, retry, true);
assert.equal(signs, 1);
assert.equal(submissions, 2);
assert.equal(retries, 1);
status = { ...status, submissionStatus: "reported" };
await request();
assert.equal(signs, 1);
assert.equal(submissions, 2);
console.log("ZATCA idempotency orchestration verifier passed.");