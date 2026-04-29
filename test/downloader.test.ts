import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import type { BitbucketEntry } from "../src/bitbucket.js";
import { downloadSkill, type SkillSource } from "../src/downloader.js";

void test("downloadSkill replaces stale local files with upstream content", async () => {
  const cwd = await makeTempProject("download-clean-");
  const skillRoot = path.join(cwd, ".skill", "разработка", "x-uikit");

  try {
    await mkdir(skillRoot, { recursive: true });
    await writeFile(path.join(skillRoot, "old.txt"), "stale", "utf8");

    const source = new FakeSource({
      "разработка/x-uikit": [
        { path: "разработка/x-uikit/button", type: "commit_directory" },
        { path: "разработка/x-uikit/README.md", type: "commit_file" }
      ],
      "разработка/x-uikit/button": [
        { path: "разработка/x-uikit/button/index.ts", type: "commit_file" }
      ]
    });

    await downloadSkill(source, cwd, "разработка/x-uikit", noopLogger);

    assert.equal(await readFile(path.join(skillRoot, "README.md"), "utf8"), "readme");
    assert.equal(await readFile(path.join(skillRoot, "button", "index.ts"), "utf8"), "button");
    await assert.rejects(readFile(path.join(skillRoot, "old.txt"), "utf8"), /ENOENT/);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

class FakeSource implements SkillSource {
  constructor(private readonly tree: Record<string, BitbucketEntry[]>) {}

  downloadFile(filePath: string): Promise<Uint8Array> {
    const files: Record<string, string> = {
      "разработка/x-uikit/README.md": "readme",
      "разработка/x-uikit/button/index.ts": "button"
    };

    return Promise.resolve(new TextEncoder().encode(files[filePath] ?? ""));
  }

  listDirectory(directoryPath: string): Promise<BitbucketEntry[]> {
    return Promise.resolve(this.tree[directoryPath] ?? []);
  }
}

const noopLogger = {
  info() {},
  warn() {},
  error() {}
};

async function makeTempProject(prefix: string): Promise<string> {
  const tmpRoot = path.join(process.cwd(), "tmp");
  await mkdir(tmpRoot, { recursive: true });
  return mkdtemp(path.join(tmpRoot, prefix));
}
