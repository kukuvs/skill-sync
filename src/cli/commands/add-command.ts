import { AddSkillUseCase } from "../../app/add-skill-use-case.js";
import { type CliOptions, loadConfig } from "../runtime-config.js";
import { createSkillSyncContext } from "../../app/skill-sync-context.js";
import type { Logger } from "../../shared/logger.js";

interface AddCommandDependencies {
  createContext: typeof createSkillSyncContext;
}

const defaultDependencies: AddCommandDependencies = {
  createContext: createSkillSyncContext
};

export async function addCommand(
  skillPath: string,
  options: CliOptions,
  logger: Logger,
  dependencies: AddCommandDependencies = defaultDependencies
): Promise<void> {
  const config = await loadConfig(options);
  const context = dependencies.createContext(config, logger);
  await new AddSkillUseCase(context).execute(skillPath);
}
