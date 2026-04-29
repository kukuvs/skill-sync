import type { SkillDownloaderPort } from "./ports/skill-downloader.js";
import type { SkillLockStorePort } from "./ports/skill-lock-store.js";
import type { Logger } from "../shared/logger.js";
import { normalizeSkillPath } from "../shared/skill-path.js";

export class AddSkillUseCase {
  constructor(
    private readonly downloader: SkillDownloaderPort,
    private readonly lockStore: SkillLockStorePort,
    private readonly logger: Logger
  ) {}

  async execute(skillPath: string): Promise<void> {
    const normalizedSkillPath = normalizeSkillPath(skillPath);
    const summary = await this.downloader.download(normalizedSkillPath);

    await this.lockStore.add([normalizedSkillPath]);
    this.logger.info(
      `Added "${summary.skillPath}" and downloaded ${summary.files} file(s) into .skill/.`
    );
  }
}
