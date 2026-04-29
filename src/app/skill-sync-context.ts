import type { RuntimeConfig } from "../cli/runtime-config.js";
import { listSkillCandidates } from "./list-skill-candidates.js";
import { BitbucketClient } from "../infrastructure/bitbucket-client.js";
import { SkillDownloader, type SkillDownloaderLike } from "../infrastructure/skill-downloader.js";
import { SkillLockStore, type SkillLockStoreLike } from "../infrastructure/skill-lock-store.js";
import { selectMany, type SkillSelector } from "../infrastructure/terminal/selector.js";
import type { Logger } from "../shared/logger.js";

export interface SkillSyncContext {
  downloader: SkillDownloaderLike;
  lockStore: SkillLockStoreLike;
  logger: Logger;
  listSkillCandidates(): Promise<string[]>;
  selectMany: SkillSelector;
}

export function createSkillSyncContext(config: RuntimeConfig, logger: Logger): SkillSyncContext {
  const client = new BitbucketClient(config);

  return {
    downloader: new SkillDownloader(client, config.cwd, logger),
    lockStore: new SkillLockStore(config.cwd),
    logger,
    listSkillCandidates() {
      return listSkillCandidates(client);
    },
    selectMany
  };
}
