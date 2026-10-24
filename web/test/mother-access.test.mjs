// Mother access links in the mock data layer (PRD M01, Figma "Your follow-up
// link" and "This link can't be used"). Run with `npm test` from web/.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

// Two module instances sharing one localStorage stand in for two browser tabs.
const storage = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
  },
};
const tabA = await import("../src/lib/data/mock.js?tabA");
const tabB = await import("../src/lib/data/mock.js?tabB");

const MARIA = tabA.getDemoMotherToken();
const EXPIRED = "Xs0Ib4Nh8Tc2Ek6Qa9Wz3P";
const discharge = (key) => ({
  alias: "Joy Test",
  barangay: "Libag Sur",
  birth_at: "2026-10-18T09:00:00+08:00",
  discharge_at: "2026-10-19T09:00:00+08:00",
  due_at: "2026-10-20T09:00:00+08:00",
  idempotency_key: key,
});

beforeEach(async () => {
  await Promise.all([tabA.resetDemoData(), tabB.resetDemoData()]);
  storage.clear();
});

test("a case ID is not a mother link", async () => {
  assert.equal(await tabA.getCaseByToken("ia-0042"), null);
  assert.equal(await tabA.getCaseByToken("IA-0042"), null);
  assert.equal(await tabA.getCaseByToken("preview-scheduled"), null);
});

test("prototype property names are not links", async () => {
  assert.equal(await tabA.getCaseByToken("constructor"), null);
  assert.equal(await tabA.getCaseByToken("__proto__"), null);
  assert.equal(await tabA.getSimulatedMessage("toString"), null);
});

test("the demo token opens Maria's case", async () => {
  const c = await tabA.getCaseByToken(MARIA);
  assert.equal(c.id, "IA-0042");
  assert.equal(c.alias, "Maria Santos");
});

test("an expired link reveals no case but its SMS still exists", async () => {
  assert.equal(await tabA.getCaseByToken(EXPIRED), null);
  const sms = await tabA.getSimulatedMessage(EXPIRED);
  assert.equal(sms.alias, "Maria Santos");
});

test("an unknown token has no simulated SMS", async () => {
  assert.equal(await tabA.getSimulatedMessage("not-a-token"), null);
});

test("a contact request through an expired link is rejected", async () => {
  await assert.rejects(tabA.createContactRequest(EXPIRED), /Unknown link/);
});

test("the hospital profile gets the live link, not the expired one", async () => {
  const link = await tabA.getMotherLink("IA-0042");
  assert.equal(link.token, MARIA);
  await assert.rejects(tabA.getMotherLink("IA-9999"), /Unknown case/);
});

test("saving a discharge issues an opaque link that expires in 14 days", async () => {
  const saved = await tabA.createDischarge(discharge("k1"));
  assert.match(saved.link.token, /^[0-9a-f]{32}$/);
  assert.equal(Date.parse(saved.link.expires_at) - Date.parse(saved.case.recorded_at), 14 * 86400000);
  assert.equal((await tabA.getCaseByToken(saved.link.token)).alias, "Joy Test");
  assert.equal(await tabA.getCaseByToken(saved.case.id.toLowerCase()), null);
});

test("a duplicate save returns the same case and link", async () => {
  const first = await tabA.createDischarge(discharge("k2"));
  const again = await tabA.createDischarge(discharge("k2"));
  assert.equal(again.duplicate, true);
  assert.equal(again.case.id, first.case.id);
  assert.equal(again.link.token, first.link.token);
});

test("a link issued in one tab opens in another", async () => {
  const saved = await tabA.createDischarge(discharge("k3"));
  assert.equal((await tabB.getCaseByToken(saved.link.token)).alias, "Joy Test");
});

test("saves from two tabs both survive", async () => {
  const saved = await tabA.createDischarge(discharge("k4"));
  await tabB.createContactRequest(saved.link.token);
  await tabA.acknowledgeCase(saved.case.id, { worker_name: "Ana" });
  const c = await tabB.getCaseByToken(saved.link.token);
  assert.equal(c.request_state, "recorded");
  assert.equal(c.handoff_state, "acknowledged");
});

test("reset removes issued links and restores the seed", async () => {
  const saved = await tabA.createDischarge(discharge("k5"));
  await tabA.createContactRequest(MARIA);
  await tabA.acknowledgeCase("IA-0042", { worker_name: "Ana" });
  // A second tab has already loaded the edited state before the reset.
  assert.equal((await tabB.getCaseByToken(MARIA)).request_state, "recorded");
  assert.ok(await tabB.getCaseByToken(saved.link.token));
  await tabA.resetDemoData();
  assert.equal(await tabA.getCaseByToken(saved.link.token), null);
  assert.equal((await tabA.getCaseByToken(MARIA)).request_state, "none");
  const restored = await tabB.getCaseByToken(MARIA);
  assert.equal(restored.request_state, "none");
  assert.equal(restored.handoff_state, "pending");
  assert.equal(restored.events.length, 0);
  assert.equal(await tabB.getCaseByToken(saved.link.token), null);
  // An action in the old tab must not bring deleted cases back.
  await tabB.createContactRequest(MARIA);
  assert.equal(await tabA.getCaseByToken(saved.link.token), null);
});
