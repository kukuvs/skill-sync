import type { SkillSyncContext } from "./skill-sync-context.js";

export class SearchSkillsUseCase {
  constructor(private readonly context: SkillSyncContext) {}

  async execute(filter: string | undefined): Promise<void> {
    const allDirectories = await this.context.listSkillCandidates();
    const normalizedFilter = filter?.trim().toLocaleLowerCase();
    const candidates = normalizedFilter
      ? allDirectories.filter((item) => item.toLocaleLowerCase().includes(normalizedFilter))
      : allDirectories;

    if (candidates.length === 0) {
      this.context.logger.warn("No skills were found.");
      return;
    }

    const selected = await this.context.selectMany(candidates, "Available skills");

    if (selected.length === 0) {
      this.context.logger.warn("No skills selected.");
      return;
    }

    await this.context.lockStore.add(selected);

    for (const skillPath of selected) {
      this.context.logger.info(`Downloading ${skillPath}...`);
      await this.context.downloader.download(skillPath);
    }

    this.context.logger.info(`Added and downloaded ${selected.length} skill(s).`);
  }
}
