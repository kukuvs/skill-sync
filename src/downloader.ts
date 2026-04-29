import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { BitbucketClient, BitbucketEntry } from "./bitbucket.js";
import type { Logger } from "./logger.js";
import { normalizeSkillPath, resolveInside } from "./paths.js";

export interface DownloadSummary {
  directories: number;
  files: number;
  skillPath: string;
}

export async function downloadSkill(
  client: BitbucketClient,
  cwd: string,
  rawSkillPath: string,
  logger: Logger
): Promise<DownloadSummary> {
  const skillPath = normalizeSkillPath(rawSkillPath);
  const skillRoot = resolveInside(path.join(cwd, ".skill"), skillPath);

  await mkdir(skillRoot, { recursive: true });

  const summary: DownloadSummary = {
    directories: 1,
    files: 0,
    skillPath
  };

  await downloadDirectory(client, skillPath, skillRoot, skillPath, logger, summary);
  return summary;
}

async function downloadDirectory(
  client: BitbucketClient,
  sourceDirectory: string,
  localRoot: string,
  skillPath: string,
  logger: Logger,
  summary: DownloadSummary
): Promise<void> {
  const entries = await client.listDirectory(sourceDirectory);

  for (const entry of entries) {
    if (entry.type === "commit_directory") {
      const directory = resolveLocalTarget(localRoot, skillPath, entry);
      await mkdir(directory, { recursive: true });
      summary.directories += 1;
      await downloadDirectory(client, entry.path, localRoot, skillPath, logger, summary);
      continue;
    }

    const targetFile = resolveLocalTarget(localRoot, skillPath, entry);
    const content = await client.downloadFile(entry.path);
    await mkdir(path.dirname(targetFile), { recursive: true });
    await writeFile(targetFile, content);
    summary.files += 1;
  }

  if (entries.length === 0) {
    logger.warn(`Skill "${sourceDirectory}" is empty.`);
  }
}

function resolveLocalTarget(localRoot: string, skillPath: string, entry: BitbucketEntry): string {
  const relativePath = entry.path === skillPath ? "" : entry.path.slice(skillPath.length + 1);
  return resolveInside(localRoot, relativePath);
}
