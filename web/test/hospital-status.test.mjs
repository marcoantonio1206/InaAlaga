import { test } from "node:test";
import assert from "node:assert/strict";
import { contactSummary, visitSummary } from "../src/lib/hospitalStatus.js";

const completed = { id: "old", state: "completed", scheduled_for: "2026-10-18T09:00:00+08:00" };
const scheduled = { id: "next", state: "scheduled", scheduled_for: "2026-10-20T10:00:00+08:00" };

test("facilitator summary preserves completed history alongside the next visit", () => {
  const summary = visitSummary({ visits: [completed, scheduled] });
  assert.match(summary, /Scheduled · Oct 20/);
  assert.match(summary, /Previous visit completed/);
});

test("request acknowledgment and the latest contact attempt stay separate", () => {
  const attempts = [
    { started_at: "2026-10-18T09:00:00+08:00", outcome: "reached" },
    { started_at: "2026-10-19T10:00:00+08:00", outcome: "not_reached" },
  ];
  assert.equal(contactSummary({ request_state: "acknowledged", contact_attempts: attempts }), "Request acknowledged · Not reached · Oct 19 · 10:00 AM");
  assert.equal(contactSummary({ request_state: "recorded", contact_attempts: [] }), "Contact requested · Awaiting acknowledgment");
  assert.equal(contactSummary({ request_state: "none", contact_attempts: [] }), "No contact updates");
  assert.equal(attempts[0].outcome, "reached");
});
