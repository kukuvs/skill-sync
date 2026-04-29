import type { CliOptions } from "../config.js";
import { loadConfig } from "../config.js";
import type { Logger } from "../logger.js";
import { SkillSyncService } from "../skill-sync-service.js";

export async function syncCommand(options: CliOptions, logger: Logger): Promise<void> {
  const config = await loadConfig(options);
  const service = new SkillSyncService(config, logger);
  await service.sync();
}
