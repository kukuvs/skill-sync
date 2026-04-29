import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

void test("clean-dist script removes the dist directory", async () => {
  const distDir = path.join(process.cwd(), "tmp", "clean-dist-target");
  const markerFile = path.join(distDir, "marker.txt");

  await rm(distDir, { force: true, recursive: true });
  await mkdir(distDir, { recursive: true });
  await writeFile(markerFile, "stale", "utf8");
  assert.equal(await readFile(markerFile, "utf8"), "stale");

  try {
    await execFileAsync(process.execPath, ["./scripts/clean-dist.mjs", distDir], {
      cwd: process.cwd()
    });

    await assert.rejects(readFile(markerFile, "utf8"), /ENOENT/);
  } finally {
    await rm(distDir, { force: true, recursive: true });
  }
});
