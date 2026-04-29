import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { addCommand } from "../src/commands/add.js";
import { SkillDownloader } from "../src/downloader.js";
import { SkillLockStore } from "../src/lockfile.js";
import { SkillSyncService } from "../src/skill-sync-service.js";
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
        createService: (config, logger) =>
          new SkillSyncService(config, logger, {
            createClient() {
              return source;
            },
            createDownloader(client, projectDir, downloadLogger) {
              return new SkillDownloader(client, projectDir, downloadLogger);
            },
            createLockStore(projectDir) {
              return new SkillLockStore(projectDir);
            },
            listCandidates() {
              return Promise.resolve([]);
            },
            selectMany() {
              return Promise.resolve([]);
            }
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
