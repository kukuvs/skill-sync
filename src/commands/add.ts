import { BitbucketClient } from "../bitbucket.js";
import type { CliOptions } from "../config.js";
import { loadConfig } from "../config.js";
import { downloadSkill } from "../downloader.js";
import { addSkillsToLock } from "../lockfile.js";
import type { Logger } from "../logger.js";
import { normalizeSkillPath } from "../paths.js";

interface AddCommandDependencies {
  addSkills: typeof addSkillsToLock;
  download: typeof downloadSkill;
}

const defaultDependencies: AddCommandDependencies = {
  addSkills: addSkillsToLock,
  download: downloadSkill
};

export async function addCommand(
  skillPath: string,
  options: CliOptions,
  logger: Logger,
  dependencies: AddCommandDependencies = defaultDependencies
): Promise<void> {
  const config = await loadConfig(options);
  const normalizedSkillPath = normalizeSkillPath(skillPath);
  const client = new BitbucketClient(config);

  const summary = await dependencies.download(client, config.cwd, normalizedSkillPath, logger);
  await dependencies.addSkills(config.cwd, [normalizedSkillPath]);

  logger.info(`Added "${summary.skillPath}" and downloaded ${summary.files} file(s) into .skill/.`);
}
