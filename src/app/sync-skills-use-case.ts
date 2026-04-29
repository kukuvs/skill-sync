import type { SkillDownloaderPort } from "./ports/skill-downloader.js";
import type { SkillLockStorePort } from "./ports/skill-lock-store.js";
import type { Logger } from "../shared/logger.js";

export class SyncSkillsUseCase {
  constructor(
    private readonly downloader: SkillDownloaderPort,
    private readonly lockStore: SkillLockStorePort,
    private readonly logger: Logger
  ) {}

  async execute(): Promise<void> {
    const lock = await this.lockStore.read();

    if (lock.skills.length === 0) {
      this.logger.warn("skill-lock.json is missing or contains no skills. Nothing to sync.");
      return;
    }

    let files = 0;

    for (const skillPath of lock.skills) {
      this.logger.info(`Syncing ${skillPath}...`);
      const summary = await this.downloader.download(skillPath);
      files += summary.files;
    }

    this.logger.info(`Synced ${lock.skills.length} skill(s), ${files} file(s) total.`);
  }
}
