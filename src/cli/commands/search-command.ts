import { SearchSkillsUseCase } from "../../app/search-skills-use-case.js";
import { createSkillSyncContext } from "../../app/skill-sync-context.js";
import type { Logger } from "../../shared/logger.js";
import type { CliOptions } from "../runtime-config.js";
import { loadConfig } from "../runtime-config.js";

export async function searchCommand(
  filter: string | undefined,
  options: CliOptions,
  logger: Logger
): Promise<void> {
  const config = await loadConfig(options);
  const context = createSkillSyncContext(config, logger);
  await new SearchSkillsUseCase(context).execute(filter);
}
