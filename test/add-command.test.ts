import { test } from "node:test";
import assert from "node:assert/strict";

import { SkillSyncService } from "../src/skill-sync-service.js";

void test("SkillSyncService keeps lock intact when add download fails", async () => {
  const lockStore = new InMemoryLockStore(["existing/skill"]);
  const downloader = new FailingDownloader();

  const service = new SkillSyncService(
    {
      cwd: process.cwd(),
      ref: "main",
      repo: { workspace: "team", repoSlug: "skills-repo" },
      token: "token"
    },
    noopLogger,
    {
      createClient() {
        return new FakeClient();
      },
      createDownloader() {
        return downloader;
      },
      createLockStore() {
        return lockStore;
      },
      listCandidates() {
        return Promise.resolve([]);
      },
      selectMany() {
        return Promise.resolve([]);
      }
    }
  );

  await assert.rejects(service.add("missing/skill"), /download failed/);
  assert.deepEqual(lockStore.skills, ["existing/skill"]);
  assert.equal(lockStore.addCalls, 0);
});

class FakeClient {
  downloadFile(): Promise<Uint8Array> {
    return Promise.resolve(new Uint8Array());
  }

  listDirectory(): Promise<[]> {
    return Promise.resolve([]);
  }
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
