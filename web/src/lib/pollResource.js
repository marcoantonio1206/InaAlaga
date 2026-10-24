// Serialize refreshes. A newer refresh supersedes an in-flight response;
// disposing suppresses late results after navigation/unmount.
export function createResourcePoller(load, { onData, onError, onBusy }) {
  let active = true;
  let running = false;
  let queued = false;
  async function refresh() {
    if (!active) return;
    if (running) { queued = true; return; }
    running = true;
    onBusy(true);
    try {
      const data = await load();
      if (active && !queued) onData(data);
    } catch (error) {
      if (active && !queued) onError(error);
    } finally {
      running = false;
      if (active && queued) {
        queued = false;
        void refresh();
      } else if (active) onBusy(false);
    }
  }
  return { refresh, stop() { active = false; queued = false; } };
}
