import { test } from "node:test";
import assert from "node:assert/strict";

import { AddSkillUseCase } from "../../src/app/add-skill-use-case.js";
import type { SkillDownloaderPort } from "../../src/app/ports/skill-downloader.js";
import type { SkillLockStorePort } from "../../src/app/ports/skill-lock-store.js";
import type { Logger } from "../../src/shared/logger.js";

void test("AddSkillUseCase keeps lock intact when download fails", async () => {
  const lockStore = new InMemoryLockStore(["existing/skill"]);
  const useCase = new AddSkillUseCase(new FailingDownloader(), lockStore, noopLogger);

  await assert.rejects(useCase.execute("missing/skill"), /download failed/);
  assert.deepEqual(lockStore.skills, ["existing/skill"]);
  assert.equal(lockStore.addCalls, 0);
});

class FailingDownloader implements SkillDownloaderPort {
  download(): Promise<never> {
    return Promise.reject(new Error("download failed"));
  }
}

class InMemoryLockStore implements SkillLockStorePort {
  addCalls = 0;

  constructor(readonly skills: string[]) {}

  add(skillPaths: string[]): Promise<{ skills: string[] }> {
    this.addCalls += 1;
    this.skills.push(...skillPaths);
    return Promise.resolve({ skills: [...this.skills] });
  }

  read(): Promise<{ skills: string[] }> {
    return Promise.resolve({ skills: [...this.skills] });
  }
}

const noopLogger: Logger = {
  info() {},
  warn() {},
  error() {}
};
