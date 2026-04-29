import type { SkillCatalogPort } from "./ports/skill-catalog.js";
import type { SkillDownloaderPort } from "./ports/skill-downloader.js";
import type { SkillLockStorePort } from "./ports/skill-lock-store.js";
import type { SkillSelectorPort } from "./ports/skill-selector.js";
import type { Logger } from "../shared/logger.js";

export class SearchSkillsUseCase {
  constructor(
    private readonly catalog: SkillCatalogPort,
    private readonly selector: SkillSelectorPort,
    private readonly lockStore: SkillLockStorePort,
    private readonly downloader: SkillDownloaderPort,
    private readonly logger: Logger
  ) {}

  async execute(filter: string | undefined): Promise<void> {
    const allDirectories = await this.catalog.listCandidates();
    const normalizedFilter = filter?.trim().toLocaleLowerCase();
    const candidates = normalizedFilter
      ? allDirectories.filter((item) => item.toLocaleLowerCase().includes(normalizedFilter))
      : allDirectories;

    if (candidates.length === 0) {
      this.logger.warn("No skills were found.");
      return;
    }

    const selected = await this.selector.selectMany(candidates, "Available skills");

    if (selected.length === 0) {
      this.logger.warn("No skills selected.");
      return;
    }

    await this.lockStore.add(selected);

    for (const skillPath of selected) {
      this.logger.info(`Downloading ${skillPath}...`);
      await this.downloader.download(skillPath);
    }

    this.logger.info(`Added and downloaded ${selected.length} skill(s).`);
  }
}
