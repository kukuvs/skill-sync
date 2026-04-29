import type { CliOptions, RuntimeConfig } from "../config.js";
import { loadConfig } from "../config.js";
import type { Logger } from "../logger.js";
import { SkillSyncService } from "../skill-sync-service.js";

interface AddCommandDependencies {
  createService: typeof createSkillSyncService;
}

const defaultDependencies: AddCommandDependencies = {
  createService: createSkillSyncService
};

export async function addCommand(
  skillPath: string,
  options: CliOptions,
  logger: Logger,
  dependencies: AddCommandDependencies = defaultDependencies
): Promise<void> {
  const config = await loadConfig(options);
  const service = dependencies.createService(config, logger);
  await service.add(skillPath);
}

function createSkillSyncService(config: RuntimeConfig, logger: Logger) {
  return new SkillSyncService(config, logger);
}
