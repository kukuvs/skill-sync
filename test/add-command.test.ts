import { test } from "node:test";
import assert from "node:assert/strict";

import { AddSkillUseCase } from "../src/app/add-skill-use-case.js";

void test("AddSkillUseCase keeps lock intact when download fails", async () => {
  const context = createContext();
  const useCase = new AddSkillUseCase(context);

  await assert.rejects(useCase.execute("missing/skill"), /download failed/);
  assert.deepEqual(context.lockStore.skills, ["existing/skill"]);
  assert.equal(context.lockStore.addCalls, 0);
});

function createContext() {
  return {
    downloader: new FailingDownloader(),
    lockStore: new InMemoryLockStore(["existing/skill"]),
    logger: noopLogger,
    listSkillCandidates() {
      return Promise.resolve([]);
    },
    selectMany() {
      return Promise.resolve([]);
    }
  };
}

class FailingDownloader {
  download(): Promise<never> {
    return Promise.reject(new Error("download failed"));
  }
}

class InMemoryLockStore {
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

const noopLogger = {
  info() {},
  warn() {},
  error() {}
};
