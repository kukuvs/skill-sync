import { test } from "node:test";
import assert from "node:assert/strict";

import { TerminalSecretPrompt } from "../src/infrastructure/input/terminal-secret-prompt.js";

void test("TerminalSecretPrompt rejects non-TTY input instead of echoing a token prompt", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(process.stdin, "isTTY");

  Object.defineProperty(process.stdin, "isTTY", {
    configurable: true,
    value: false
  });

  try {
    await assert.rejects(new TerminalSecretPrompt().ask("Token: "), /Secret prompts require a TTY/);
  } finally {
    if (descriptor) {
      Object.defineProperty(process.stdin, "isTTY", descriptor);
    }
  }
});
