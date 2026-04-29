import { mkdir, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { addSkillsToLock, readSkillLock } from "../src/lockfile.js";

void test("addSkillsToLock keeps insertion order and skips duplicates", async () => {
  const cwd = await makeTempProject("lock-order-");

  try {
    await addSkillsToLock(cwd, ["разработка/x-uikit", "тестирование/jest-config"]);
    await addSkillsToLock(cwd, ["разработка/x-uikit", "разработка/x-uikit/button"]);

    const lock = await readSkillLock(cwd);
    assert.deepEqual(lock.skills, [
      "разработка/x-uikit",
      "тестирование/jest-config",
      "разработка/x-uikit/button"
    ]);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test("addSkillsToLock normalizes valid user-entered separators", async () => {
  const cwd = await makeTempProject("lock-normalize-");

  try {
    await addSkillsToLock(cwd, ["\\разработка\\x-uikit\\button\\"]);

    const lock = await readSkillLock(cwd);
    assert.deepEqual(lock.skills, ["разработка/x-uikit/button"]);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

async function makeTempProject(prefix: string): Promise<string> {
  const tmpRoot = path.join(process.cwd(), "tmp");
  await mkdir(tmpRoot, { recursive: true });
  return mkdtemp(path.join(tmpRoot, prefix));
}
