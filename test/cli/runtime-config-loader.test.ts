import { test } from "node:test";
import assert from "node:assert/strict";

import { RuntimeConfigLoader } from "../../src/cli/runtime-config.js";

void test("RuntimeConfigLoader parses Bitbucket Cloud repository URLs", () => {
  const loader = new RuntimeConfigLoader();

  assert.deepEqual(loader.parseBitbucketRepoUrl("https://bitbucket.org/team/skills-repo.git"), {
    workspace: "team",
    repoSlug: "skills-repo"
  });
});

void test("RuntimeConfigLoader accepts trailing slashes in repo URLs", () => {
  const loader = new RuntimeConfigLoader();

  assert.deepEqual(loader.parseBitbucketRepoUrl("https://bitbucket.org/team/skills-repo/"), {
    workspace: "team",
    repoSlug: "skills-repo"
  });
});

void test("RuntimeConfigLoader rejects non-Bitbucket hosts", () => {
  const loader = new RuntimeConfigLoader();

  assert.throws(
    () => loader.parseBitbucketRepoUrl("https://example.com/team/skills-repo"),
    /must point to bitbucket\.org/
  );
});

void test("RuntimeConfigLoader prefers explicit ref, then BITBUCKET_REF, then main", async () => {
  const previousRepo = process.env.BITBUCKET_REPO_URL;
  const previousToken = process.env.BITBUCKET_TOKEN;
  const previousRef = process.env.BITBUCKET_REF;

  process.env.BITBUCKET_REPO_URL = "https://bitbucket.org/team/skills-repo";
  process.env.BITBUCKET_TOKEN = "token";

  try {
    const loader = new RuntimeConfigLoader();

    process.env.BITBUCKET_REF = "develop";
    assert.equal((await loader.load({})).ref, "develop");
    assert.equal((await loader.load({ ref: "release" })).ref, "release");

    delete process.env.BITBUCKET_REF;
    assert.equal((await loader.load({})).ref, "main");
  } finally {
    restoreEnv("BITBUCKET_REPO_URL", previousRepo);
    restoreEnv("BITBUCKET_TOKEN", previousToken);
    restoreEnv("BITBUCKET_REF", previousRef);
  }
});

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
