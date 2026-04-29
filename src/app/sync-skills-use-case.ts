import type { SkillSyncContext } from "./skill-sync-context.js";

export class SyncSkillsUseCase {
  constructor(private readonly context: SkillSyncContext) {}

  async execute(): Promise<void> {
    const lock = await this.context.lockStore.read();

    if (lock.skills.length === 0) {
      this.context.logger.warn(
        "skill-lock.json is missing or contains no skills. Nothing to sync."
      );
      return;
    }

    let files = 0;

    for (const skillPath of lock.skills) {
      this.context.logger.info(`Syncing ${skillPath}...`);
      const summary = await this.context.downloader.download(skillPath);
      files += summary.files;
    }

    this.context.logger.info(`Synced ${lock.skills.length} skill(s), ${files} file(s) total.`);
  }
}
