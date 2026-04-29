import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { createSkillSyncContext } from "../src/app/skill-sync-context.js";
import { addCommand } from "../src/cli/commands/add-command.js";
import { SkillDownloader } from "../src/infrastructure/skill-downloader.js";
import { SkillLockStore } from "../src/infrastructure/skill-lock-store.js";
import { LocalSkillSource } from "./support/local-skill-source.js";

void test("user adds a fixture skill into a clean project", async () => {
  const cwd = await makeTempProject("user-add-");
  const source = new LocalSkillSource(path.join(process.cwd(), "test", "fixtures", "source-repo"));

  try {
    await addCommand(
      "разработка/sample-skill",
      { cwd, repo: repoUrl, token: "token" },
      noopLogger,
      {
        createContext: (config, logger) => ({
          ...createSkillSyncContext(config, logger),
          downloader: new SkillDownloader(source, config.cwd, logger),
          lockStore: new SkillLockStore(config.cwd)
        })
      }
    );

    const lock = JSON.parse(await readFile(path.join(cwd, "skill-lock.json"), "utf8")) as {
      skills: string[];
    };
    const skillReadme = await readFile(
      path.join(cwd, ".skill", "разработка", "sample-skill", "SKILL.md"),
      "utf8"
    );
    const nestedConfig = await readFile(
      path.join(cwd, ".skill", "разработка", "sample-skill", "nested", "config.json"),
      "utf8"
    );

    assert.deepEqual(lock.skills, ["разработка/sample-skill"]);
    assert.match(skillReadme, /Sample Skill/);
    assert.match(nestedConfig, /"enabled": true/);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

const repoUrl = "https://bitbucket.org/team/skills-repo";

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
