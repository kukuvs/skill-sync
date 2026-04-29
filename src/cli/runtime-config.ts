import { askSecret, askText } from "../infrastructure/terminal/prompt.js";
import { SkillSyncError } from "../shared/errors.js";

export interface CliOptions {
  cwd?: string;
  ref?: string;
  repo?: string;
  token?: string;
}

export interface RuntimeConfig {
  cwd: string;
  ref: string;
  repo: BitbucketRepo;
  token: string;
}

export interface BitbucketRepo {
  repoSlug: string;
  workspace: string;
}

export async function loadConfig(options: CliOptions): Promise<RuntimeConfig> {
  const repoUrl =
    options.repo ?? process.env.BITBUCKET_REPO_URL ?? (await askText("Bitbucket repo URL: "));
  const token =
    options.token ?? process.env.BITBUCKET_TOKEN ?? (await askSecret("Bitbucket token: "));
  const ref = options.ref ?? process.env.BITBUCKET_REF ?? "main";

  if (token.length === 0) {
    throw new SkillSyncError("BITBUCKET_TOKEN is required.");
  }

  return {
    cwd: options.cwd ?? process.cwd(),
    ref,
    repo: parseBitbucketRepoUrl(repoUrl),
    token
  };
}

export function parseBitbucketRepoUrl(repoUrl: string): BitbucketRepo {
  let url: URL;

  try {
    url = new URL(repoUrl);
  } catch {
    throw new SkillSyncError(`Invalid BITBUCKET_REPO_URL: ${repoUrl}`);
  }

  if (url.hostname !== "bitbucket.org") {
    throw new SkillSyncError("BITBUCKET_REPO_URL must point to bitbucket.org.");
  }

  const [workspace, repoName] = url.pathname.split("/").filter(Boolean);
  const repoSlug = repoName?.replace(/\.git$/i, "");

  if (!workspace || !repoSlug) {
    throw new SkillSyncError(
      "BITBUCKET_REPO_URL must look like https://bitbucket.org/workspace/repo."
    );
  }

  return { workspace, repoSlug };
}
