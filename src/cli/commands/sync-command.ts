import { SkillSyncUseCaseFactory } from "../../app/skill-sync-use-case-factory.js";
import type { Logger } from "../../shared/logger.js";
import { RuntimeConfigLoader, type CliOptions } from "../runtime-config.js";

export async function syncCommand(options: CliOptions, logger: Logger): Promise<void> {
  const config = await new RuntimeConfigLoader().load(options);
  await new SkillSyncUseCaseFactory(config, logger).createSyncSkillsUseCase().execute();
}
