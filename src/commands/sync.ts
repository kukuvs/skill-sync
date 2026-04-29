import { BitbucketClient } from "../bitbucket.js";
import type { CliOptions } from "../config.js";
import { loadConfig } from "../config.js";
import { downloadSkill } from "../downloader.js";
import { readSkillLock } from "../lockfile.js";
import type { Logger } from "../logger.js";

export async function syncCommand(options: CliOptions, logger: Logger): Promise<void> {
  const lock = await readSkillLock(options.cwd ?? process.cwd());

  if (lock.skills.length === 0) {
    logger.warn("skill-lock.json is missing or contains no skills. Nothing to sync.");
    return;
  }

  const config = await loadConfig(options);
  const client = new BitbucketClient(config);
  let files = 0;

  for (const skillPath of lock.skills) {
    logger.info(`Syncing ${skillPath}...`);
    const summary = await downloadSkill(client, config.cwd, skillPath, logger);
    files += summary.files;
  }

  logger.info(`Synced ${lock.skills.length} skill(s), ${files} file(s) total.`);
}
