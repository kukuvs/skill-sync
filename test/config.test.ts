import { test } from "node:test";
import assert from "node:assert/strict";

import { loadConfig, parseBitbucketRepoUrl } from "../src/config.js";

void test("parseBitbucketRepoUrl accepts Bitbucket Cloud repository URLs", () => {
  assert.deepEqual(parseBitbucketRepoUrl("https://bitbucket.org/team/skills-repo.git"), {
    workspace: "team",
    repoSlug: "skills-repo"
  });
});

void test("parseBitbucketRepoUrl accepts trailing slashes", () => {
  assert.deepEqual(parseBitbucketRepoUrl("https://bitbucket.org/team/skills-repo/"), {
    workspace: "team",
    repoSlug: "skills-repo"
  });
});

void test("parseBitbucketRepoUrl rejects non-Bitbucket hosts", () => {
  assert.throws(
    () => parseBitbucketRepoUrl("https://example.com/team/skills-repo"),
    /must point to bitbucket\.org/
  );
});

void test("loadConfig prefers explicit ref, then BITBUCKET_REF, then main", async () => {
  const previousRepo = process.env.BITBUCKET_REPO_URL;
  const previousToken = process.env.BITBUCKET_TOKEN;
  const previousRef = process.env.BITBUCKET_REF;

  process.env.BITBUCKET_REPO_URL = "https://bitbucket.org/team/skills-repo";
  process.env.BITBUCKET_TOKEN = "token";

  try {
    process.env.BITBUCKET_REF = "develop";
    assert.equal((await loadConfig({})).ref, "develop");
    assert.equal((await loadConfig({ ref: "release" })).ref, "release");

    delete process.env.BITBUCKET_REF;
    assert.equal((await loadConfig({})).ref, "main");
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
