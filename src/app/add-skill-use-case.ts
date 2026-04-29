import type { SkillSyncContext } from "./skill-sync-context.js";
import { normalizeSkillPath } from "../shared/skill-path.js";

export class AddSkillUseCase {
  constructor(private readonly context: SkillSyncContext) {}

  async execute(skillPath: string): Promise<void> {
    const normalizedSkillPath = normalizeSkillPath(skillPath);
    const summary = await this.context.downloader.download(normalizedSkillPath);

    await this.context.lockStore.add([normalizedSkillPath]);
    this.context.logger.info(
      `Added "${summary.skillPath}" and downloaded ${summary.files} file(s) into .skill/.`
    );
  }
}
