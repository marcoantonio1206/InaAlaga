import test from 'node:test';
import assert from 'node:assert/strict';
import { toManilaLocalInput } from '../src/lib/validation.js';

const storage = new Map();
globalThis.window = { localStorage: {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
} };
const actions = await import('../src/lib/data/mock.js?audit-worker');
const reader = await import('../src/lib/data/mock.js?audit-reader');

test('new actions record wall-clock save time, persist it, and keep entered visit times separate', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-10-24T05:06:07.123Z') });
  await actions.resetDemoData();
  const stamp = () => new Date().toISOString();
  const nextTime = () => t.mock.timers.tick(61_000);
  const checkEvent = (c, expected) => assert.equal(c.events.at(-1).at, expected);

  const acceptedAt = stamp();
  let c = await actions.acknowledgeCase('IA-0042', { worker_name: 'Ana' });
  assert.equal(c.acknowledged_at, acceptedAt);
  checkEvent(c, acceptedAt);
  nextTime();
  c = await actions.acknowledgeCase('IA-0042', { worker_name: 'Ana' });
  assert.equal(c.acknowledged_at, acceptedAt, 'repeated acceptance preserves the original action time');
  assert.equal(c.events.length, 1);

  const scheduledAt = stamp();
  const scheduledFor = '2026-10-25T09:00:00+08:00';
  c = await actions.scheduleVisit('IA-0042', { scheduled_for: scheduledFor, worker_name: 'Ana' });
  assert.equal(c.visits[0].scheduled_at, scheduledAt);
  assert.equal(c.visits[0].scheduled_for, scheduledFor);
  checkEvent(c, scheduledAt);

  nextTime();
  const requestedAt = stamp();
  c = await actions.createContactRequest(actions.getDemoMotherToken());
  assert.equal(c.request_recorded_at, requestedAt);
  checkEvent(c, requestedAt);
  nextTime();
  const acknowledgedAt = stamp();
  c = await actions.acknowledgeRequest(c.id, { worker_name: 'Ana' });
  assert.equal(c.request_acknowledged_at, acknowledgedAt);
  checkEvent(c, acknowledgedAt);

  nextTime();
  const attemptedAt = stamp();
  const started = '2026-10-24T12:30:00+08:00';
  const ended = '2026-10-24T12:35:00+08:00';
  c = await actions.recordContactAttempt(c.id, {
    method: 'Phone call', started_at: started, ended_at: ended, outcome: 'reached', worker_name: 'Ana',
  });
  assert.equal(c.contact_attempts[0].recorded_at, attemptedAt);
  assert.equal(c.contact_attempts[0].started_at, started);
  assert.equal(c.contact_attempts[0].ended_at, ended);
  checkEvent(c, attemptedAt);

  nextTime();
  const completedAt = stamp();
  c = await actions.recordVisitOutcome(c.id, c.visits[0].id, { started_at: started, ended_at: ended, outcome: 'completed' });
  assert.equal(c.visits[0].completed_recorded_at, completedAt);
  assert.equal(c.visits[0].ended_at, ended);
  checkEvent(c, completedAt);
  const persisted = await reader.getCaseById(c.id);
  assert.equal(persisted.acknowledged_at, acceptedAt);
  assert.equal(persisted.visits[0].completed_recorded_at, completedAt);
  assert.equal(persisted.events.at(-1).at, completedAt);
  assert.equal(actions.getDemoNow(), '2026-10-19T12:00:00+08:00', 'schedule scenario clock stays independent');
  assert.equal(toManilaLocalInput(completedAt), '2026-10-24T13:11');
});

test('facilitator discharge saves use real audit time while keeping entered dates and seed history', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-10-24T11:15:16.123Z') });
  await actions.resetDemoData();
  const before = await actions.getCaseById('IA-0042');
  const saved = await actions.createDischarge({
    alias: 'Audit check', barangay: 'Caritan Norte',
    birth_at: '2026-10-18T09:00:00+08:00', discharge_at: '2026-10-19T09:00:00+08:00',
    due_at: '2026-10-21T09:00:00+08:00', idempotency_key: 'audit-discharge',
  });
  const at = new Date().toISOString();
  assert.equal(saved.case.recorded_at, at);
  assert.equal(saved.case.assigned_at, at);
  assert.equal(saved.case.events.at(-1).at, at);
  assert.equal(saved.case.discharge_at, '2026-10-19T09:00:00+08:00');
  assert.equal(saved.case.due_at, '2026-10-21T09:00:00+08:00');
  t.mock.timers.tick(60000);
  const duplicate = await actions.createDischarge({ idempotency_key: 'audit-discharge' });
  assert.equal(duplicate.case.recorded_at, at);
  assert.equal((await reader.getCaseById(saved.case.id)).assigned_at, at);
  assert.deepEqual(await reader.getCaseById('IA-0042'), before);
  assert.equal(actions.getDemoNow(), '2026-10-19T12:00:00+08:00');
});
