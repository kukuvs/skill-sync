import { SkillSyncUseCaseFactory } from "../../app/skill-sync-use-case-factory.js";
import type { Logger } from "../../shared/logger.js";
import { RuntimeConfigLoader, type CliOptions } from "../runtime-config.js";

export async function searchCommand(
  filter: string | undefined,
  options: CliOptions,
  logger: Logger
): Promise<void> {
  const config = await new RuntimeConfigLoader().load(options);
  await new SkillSyncUseCaseFactory(config, logger).createSearchSkillsUseCase().execute(filter);
}
