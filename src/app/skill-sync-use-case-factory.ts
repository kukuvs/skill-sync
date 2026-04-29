import type { RuntimeConfig } from "../cli/runtime-config.js";
import { BitbucketClient } from "../infrastructure/bitbucket-client.js";
import { BitbucketSkillCatalog } from "../infrastructure/bitbucket-skill-catalog.js";
import { TerminalSkillSelector } from "../infrastructure/input/terminal-skill-selector.js";
import { SkillDownloader } from "../infrastructure/skill-downloader.js";
import { SkillLockStore } from "../infrastructure/skill-lock-store.js";
import type { Logger } from "../shared/logger.js";
import { AddSkillUseCase } from "./add-skill-use-case.js";
import { SearchSkillsUseCase } from "./search-skills-use-case.js";
import { SyncSkillsUseCase } from "./sync-skills-use-case.js";

export class SkillSyncUseCaseFactory {
  constructor(
    private readonly config: RuntimeConfig,
    private readonly logger: Logger
  ) {}

  createAddSkillUseCase(): AddSkillUseCase {
    return new AddSkillUseCase(this.createDownloader(), this.createLockStore(), this.logger);
  }

  createSearchSkillsUseCase(): SearchSkillsUseCase {
    const client = this.createClient();

    return new SearchSkillsUseCase(
      new BitbucketSkillCatalog(client),
      new TerminalSkillSelector(),
      new SkillLockStore(this.config.cwd),
      new SkillDownloader(client, this.config.cwd, this.logger),
      this.logger
    );
  }

  createSyncSkillsUseCase(): SyncSkillsUseCase {
    return new SyncSkillsUseCase(this.createDownloader(), this.createLockStore(), this.logger);
  }

  private createClient(): BitbucketClient {
    return new BitbucketClient(this.config);
  }

  private createDownloader(): SkillDownloader {
    return new SkillDownloader(this.createClient(), this.config.cwd, this.logger);
  }

  private createLockStore(): SkillLockStore {
    return new SkillLockStore(this.config.cwd);
  }
}
