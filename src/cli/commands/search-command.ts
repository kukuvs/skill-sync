import { SkillSyncUseCaseFactory } from "../../app/skill-sync-use-case-factory.js";
import type { Logger } from "../../shared/logger.js";
import type { CliOptions } from "../runtime-config.js";
import { loadConfig } from "../runtime-config.js";

export async function searchCommand(
  filter: string | undefined,
  options: CliOptions,
  logger: Logger
): Promise<void> {
  const config = await loadConfig(options);
  await new SkillSyncUseCaseFactory(config, logger).createSearchSkillsUseCase().execute(filter);
}
