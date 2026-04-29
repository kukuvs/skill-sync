import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { readPackageVersion } from "../src/shared/package-version.js";

void test("readPackageVersion matches package.json", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../../package.json", import.meta.url), "utf8")
  ) as {
    version: string;
  };

  assert.equal(readPackageVersion(), packageJson.version);
});
