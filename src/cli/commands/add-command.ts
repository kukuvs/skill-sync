import type { AddSkillUseCase } from "../../app/add-skill-use-case.js";
import { SkillSyncUseCaseFactory } from "../../app/skill-sync-use-case-factory.js";
import { RuntimeConfigLoader, type CliOptions } from "../runtime-config.js";
import type { Logger } from "../../shared/logger.js";
import type { RuntimeConfig } from "../runtime-config.js";

interface AddCommandDependencies {
  createUseCase(config: RuntimeConfig, logger: Logger): AddSkillUseCase;
}

const defaultDependencies: AddCommandDependencies = {
  createUseCase(config, logger) {
    return new SkillSyncUseCaseFactory(config, logger).createAddSkillUseCase();
  }
};

export async function addCommand(
  skillPath: string,
  options: CliOptions,
  logger: Logger,
  dependencies: AddCommandDependencies = defaultDependencies
): Promise<void> {
  const config = await new RuntimeConfigLoader().load(options);
  await dependencies.createUseCase(config, logger).execute(skillPath);
}
