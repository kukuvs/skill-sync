import { mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { BitbucketEntry } from "./bitbucket.js";
import type { Logger } from "./logger.js";
import { normalizeSkillPath, resolveInside } from "./paths.js";

export interface DownloadSummary {
  directories: number;
  files: number;
  skillPath: string;
}

export interface SkillSource {
  downloadFile(filePath: string): Promise<Uint8Array>;
  listDirectory(directoryPath: string): Promise<BitbucketEntry[]>;
}

export async function downloadSkill(
  client: SkillSource,
  cwd: string,
  rawSkillPath: string,
  logger: Logger
): Promise<DownloadSummary> {
  const skillPath = normalizeSkillPath(rawSkillPath);
  const skillsRoot = path.join(cwd, ".skill");
  const skillRoot = resolveInside(skillsRoot, skillPath);
  const skillParent = path.dirname(skillRoot);

  await mkdir(skillParent, { recursive: true });
  const stagingRoot = await mkdtemp(path.join(skillParent, ".tmp-skill-sync-"));

  const summary: DownloadSummary = {
    directories: 1,
    files: 0,
    skillPath
  };

  try {
    await downloadDirectory(client, skillPath, stagingRoot, skillPath, logger, summary);
    await rm(skillRoot, { recursive: true, force: true });
    await rename(stagingRoot, skillRoot);
    return summary;
  } catch (error) {
    await rm(stagingRoot, { recursive: true, force: true });
    throw error;
  }
}

async function downloadDirectory(
  client: SkillSource,
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
