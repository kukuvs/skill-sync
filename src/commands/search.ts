import { BitbucketClient } from "../bitbucket.js";
import type { CliOptions } from "../config.js";
import { loadConfig } from "../config.js";
import { downloadSkill } from "../downloader.js";
import { addSkillsToLock } from "../lockfile.js";
import type { Logger } from "../logger.js";
import { selectMany } from "../selector.js";

export async function searchCommand(
  filter: string | undefined,
  options: CliOptions,
  logger: Logger
): Promise<void> {
  const config = await loadConfig(options);
  const client = new BitbucketClient(config);
  const allDirectories = await client.listDirectoriesRecursive();
  const normalizedFilter = filter?.trim().toLocaleLowerCase();
  const candidates = normalizedFilter
    ? allDirectories.filter((item) => item.toLocaleLowerCase().includes(normalizedFilter))
    : allDirectories;

  if (candidates.length === 0) {
    logger.warn("No skills were found.");
    return;
  }

  const selected = await selectMany(candidates, "Available skills");

  if (selected.length === 0) {
    logger.warn("No skills selected.");
    return;
  }

  await addSkillsToLock(config.cwd, selected);

  for (const skillPath of selected) {
    logger.info(`Downloading ${skillPath}...`);
    await downloadSkill(client, config.cwd, skillPath, logger);
  }

  logger.info(`Added and downloaded ${selected.length} skill(s).`);
}
