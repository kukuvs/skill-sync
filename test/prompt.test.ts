import { test } from "node:test";
import assert from "node:assert/strict";

import { askSecret } from "../src/prompt.js";

void test("askSecret rejects non-TTY input instead of echoing a token prompt", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(process.stdin, "isTTY");

  Object.defineProperty(process.stdin, "isTTY", {
    configurable: true,
    value: false
  });

  try {
    await assert.rejects(askSecret("Token: "), /Secret prompts require a TTY/);
  } finally {
    if (descriptor) {
      Object.defineProperty(process.stdin, "isTTY", descriptor);
    }
  }
});
