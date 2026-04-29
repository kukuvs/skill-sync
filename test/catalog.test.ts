import { test } from "node:test";
import assert from "node:assert/strict";

import type { BitbucketEntry } from "../src/bitbucket.js";
import { listSkillCandidates, type SkillCatalogSource } from "../src/catalog.js";

void test("listSkillCandidates skips grouping directories and keeps real skills", async () => {
  const source = new FakeCatalog({
    "": [
      { path: "разработка", type: "commit_directory" },
      { path: "тестирование", type: "commit_directory" }
    ],
    разработка: [
      { path: "разработка/x-uikit", type: "commit_directory" },
      { path: "разработка/shared-empty", type: "commit_directory" }
    ],
    "разработка/x-uikit": [
      { path: "разработка/x-uikit/button", type: "commit_directory" },
      { path: "разработка/x-uikit/SKILL.md", type: "commit_file" }
    ],
    "разработка/x-uikit/button": [
      { path: "разработка/x-uikit/button/SKILL.md", type: "commit_file" }
    ],
    "разработка/shared-empty": [],
    тестирование: [{ path: "тестирование/jest-config", type: "commit_directory" }],
    "тестирование/jest-config": [{ path: "тестирование/jest-config/index.md", type: "commit_file" }]
  });

  assert.deepEqual(await listSkillCandidates(source), [
    "разработка/shared-empty",
    "разработка/x-uikit",
    "разработка/x-uikit/button",
    "тестирование/jest-config"
  ]);
});

class FakeCatalog implements SkillCatalogSource {
  constructor(private readonly tree: Record<string, BitbucketEntry[]>) {}

  listDirectory(directoryPath: string): Promise<BitbucketEntry[]> {
    return Promise.resolve(this.tree[directoryPath] ?? []);
  }
}
