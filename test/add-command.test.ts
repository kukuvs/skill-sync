import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { addCommand } from "../src/commands/add.js";
import { addSkillsToLock } from "../src/lockfile.js";

void test("addCommand keeps existing lock intact when download fails", async () => {
  const cwd = await makeTempProject("add-fail-");
  const previousRepo = process.env.BITBUCKET_REPO_URL;
  const previousToken = process.env.BITBUCKET_TOKEN;

  process.env.BITBUCKET_REPO_URL = "https://bitbucket.org/team/skills-repo";
  process.env.BITBUCKET_TOKEN = "token";

  try {
    await writeFile(
      path.join(cwd, "skill-lock.json"),
      `${JSON.stringify({ skills: ["existing/skill"] }, null, 2)}\n`,
      "utf8"
    );

    await assert.rejects(
      addCommand(
        "missing/skill",
        { cwd, repo: process.env.BITBUCKET_REPO_URL, token: "token" },
        noopLogger,
        {
          addSkills: addSkillsToLock,
          download: () => Promise.reject(new Error("download failed"))
        }
      ),
      /download failed/
    );

    const lock = JSON.parse(await readFile(path.join(cwd, "skill-lock.json"), "utf8")) as {
      skills: string[];
    };

    assert.deepEqual(lock.skills, ["existing/skill"]);
  } finally {
    restoreEnv("BITBUCKET_REPO_URL", previousRepo);
    restoreEnv("BITBUCKET_TOKEN", previousToken);
    await rm(cwd, { recursive: true, force: true });
  }
});

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

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
