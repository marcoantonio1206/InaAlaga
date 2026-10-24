import test from "node:test";
import assert from "node:assert/strict";
import { createResourcePoller } from "../src/lib/pollResource.js";

function deferred() {
  let resolve, reject;
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}

test("a newer refresh supersedes a slow response and requests are serialized", async () => {
  const pending = [];
  const values = [];
  const busy = [];
  const poller = createResourcePoller(() => { const d = deferred(); pending.push(d); return d.promise; }, {
    onData: (v) => values.push(v), onError: assert.fail, onBusy: (v) => busy.push(v),
  });
  const first = poller.refresh();
  void poller.refresh();
  void poller.refresh();
  assert.equal(pending.length, 1);
  pending[0].resolve("stale");
  await first;
  assert.deepEqual(values, []);
  assert.equal(pending.length, 2);
  pending[1].resolve("latest");
  await pending[1].promise;
  await Promise.resolve();
  assert.deepEqual(values, ["latest"]);
  assert.equal(busy.at(-1), false);
});

test("refresh failures preserve the last value and a retry recovers", async () => {
  const values = [];
  let fail = false;
  let errors = 0;
  const poller = createResourcePoller(async () => {
    if (fail) throw new Error("Offline");
    return "saved record";
  }, { onData: (v) => values.push(v), onError: () => { errors++; }, onBusy() {} });
  await poller.refresh();
  fail = true;
  await poller.refresh();
  assert.deepEqual(values, ["saved record"]);
  assert.equal(errors, 1);
  fail = false;
  await poller.refresh();
  assert.deepEqual(values, ["saved record", "saved record"]);
});

test("closing a profile suppresses responses that arrive after navigation", async () => {
  const pending = deferred();
  const values = [];
  const poller = createResourcePoller(() => pending.promise, {
    onData: (v) => values.push(v), onError: assert.fail, onBusy() {},
  });
  const first = poller.refresh();
  void poller.refresh();
  poller.stop();
  pending.resolve("old mother");
  await first;
  assert.deepEqual(values, []);
});
