// Lets Node's built-in test runner import app modules directly: resolves the
// `@/` alias to src/, adds the omitted `.js` extension and loads src files as
// ES modules. No test dependency is needed.
import { registerHooks } from "node:module";

const SRC = new URL("../src/", import.meta.url);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const url = new URL(specifier.slice(2), SRC);
      if (!url.pathname.endsWith(".js")) url.pathname += ".js";
      return { url: url.href, format: "module", shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith(SRC.href)) {
      return { ...nextLoad(url, { ...context, format: "module" }), format: "module" };
    }
    return nextLoad(url, context);
  },
});
