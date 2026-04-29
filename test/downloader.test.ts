import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import type { BitbucketEntry } from "../src/infrastructure/bitbucket-client.js";
import { SkillDownloader, type SkillSource } from "../src/infrastructure/skill-downloader.js";

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

    await new SkillDownloader(source, cwd, noopLogger).download("разработка/x-uikit");

    assert.equal(await readFile(path.join(skillRoot, "README.md"), "utf8"), "readme");
    assert.equal(await readFile(path.join(skillRoot, "button", "index.ts"), "utf8"), "button");
    await assert.rejects(readFile(path.join(skillRoot, "old.txt"), "utf8"), /ENOENT/);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test("downloadSkill keeps existing files when staging download fails", async () => {
  const cwd = await makeTempProject("download-fail-");
  const skillRoot = path.join(cwd, ".skill", "разработка", "x-uikit");

  try {
    await mkdir(skillRoot, { recursive: true });
    await writeFile(path.join(skillRoot, "keep.txt"), "current", "utf8");

    const source = new FailingSource();

    await assert.rejects(
      new SkillDownloader(source, cwd, noopLogger).download("разработка/x-uikit"),
      /network cut/
    );
    assert.equal(await readFile(path.join(skillRoot, "keep.txt"), "utf8"), "current");
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

class FailingSource implements SkillSource {
  downloadFile(): Promise<Uint8Array> {
    return Promise.reject(new Error("network cut"));
  }

  listDirectory(): Promise<BitbucketEntry[]> {
    return Promise.resolve([{ path: "разработка/x-uikit/new.txt", type: "commit_file" }]);
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
