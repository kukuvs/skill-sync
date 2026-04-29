import { SyncSkillsUseCase } from "../../app/sync-skills-use-case.js";
import { createSkillSyncContext } from "../../app/skill-sync-context.js";
import type { Logger } from "../../shared/logger.js";
import type { CliOptions } from "../runtime-config.js";
import { loadConfig } from "../runtime-config.js";

export async function syncCommand(options: CliOptions, logger: Logger): Promise<void> {
  const config = await loadConfig(options);
  const context = createSkillSyncContext(config, logger);
  await new SyncSkillsUseCase(context).execute();
}
