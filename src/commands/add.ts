import { BitbucketClient } from "../bitbucket.js";
import type { CliOptions } from "../config.js";
import { loadConfig } from "../config.js";
import { downloadSkill } from "../downloader.js";
import { addSkillsToLock } from "../lockfile.js";
import type { Logger } from "../logger.js";
import { normalizeSkillPath } from "../paths.js";

export async function addCommand(
  skillPath: string,
  options: CliOptions,
  logger: Logger
): Promise<void> {
  const config = await loadConfig(options);
  const normalizedSkillPath = normalizeSkillPath(skillPath);
  const client = new BitbucketClient(config);

  await addSkillsToLock(config.cwd, [normalizedSkillPath]);
  const summary = await downloadSkill(client, config.cwd, normalizedSkillPath, logger);

  logger.info(`Added "${summary.skillPath}" and downloaded ${summary.files} file(s) into .skill/.`);
}
