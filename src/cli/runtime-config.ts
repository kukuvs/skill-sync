import { TerminalRuntimeConfigPrompts } from "../infrastructure/input/terminal-runtime-config-prompts.js";
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

export interface RuntimeConfigPrompts {
  askSecret(question: string): Promise<string>;
  askText(question: string): Promise<string>;
}

export class RuntimeConfigLoader {
  constructor(
    private readonly prompts: RuntimeConfigPrompts = new TerminalRuntimeConfigPrompts(),
    private readonly env: NodeJS.ProcessEnv = process.env
  ) {}

  async load(options: CliOptions): Promise<RuntimeConfig> {
    const repoUrl =
      options.repo ??
      this.env.BITBUCKET_REPO_URL ??
      (await this.prompts.askText("Bitbucket repo URL: "));
    const token =
      options.token ??
      this.env.BITBUCKET_TOKEN ??
      (await this.prompts.askSecret("Bitbucket token: "));
    const ref = options.ref ?? this.env.BITBUCKET_REF ?? "main";

    if (token.length === 0) {
      throw new SkillSyncError("BITBUCKET_TOKEN is required.");
    }

    return {
      cwd: options.cwd ?? process.cwd(),
      ref,
      repo: this.parseBitbucketRepoUrl(repoUrl),
      token
    };
  }

  parseBitbucketRepoUrl(repoUrl: string): BitbucketRepo {
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
}
