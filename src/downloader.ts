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

export class SkillDownloader {
  constructor(
    private readonly client: SkillSource,
    private readonly cwd: string,
    private readonly logger: Logger
  ) {}

  async download(rawSkillPath: string): Promise<DownloadSummary> {
    const skillPath = normalizeSkillPath(rawSkillPath);
    const skillsRoot = path.join(this.cwd, ".skill");
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
      await this.downloadDirectory(skillPath, stagingRoot, skillPath, summary);
      await rm(skillRoot, { recursive: true, force: true });
      await rename(stagingRoot, skillRoot);
      return summary;
    } catch (error) {
      await rm(stagingRoot, { recursive: true, force: true });
      throw error;
    }
  }

  private async downloadDirectory(
    sourceDirectory: string,
    localRoot: string,
    skillPath: string,
    summary: DownloadSummary
  ): Promise<void> {
    const entries = await this.client.listDirectory(sourceDirectory);

    for (const entry of entries) {
      if (entry.type === "commit_directory") {
        const directory = resolveLocalTarget(localRoot, skillPath, entry);
        await mkdir(directory, { recursive: true });
        summary.directories += 1;
        await this.downloadDirectory(entry.path, localRoot, skillPath, summary);
        continue;
      }

      const targetFile = resolveLocalTarget(localRoot, skillPath, entry);
      const content = await this.client.downloadFile(entry.path);
      await mkdir(path.dirname(targetFile), { recursive: true });
      await writeFile(targetFile, content);
      summary.files += 1;
    }

    if (entries.length === 0) {
      this.logger.warn(`Skill "${sourceDirectory}" is empty.`);
    }
  }
}

export async function downloadSkill(
  client: SkillSource,
  cwd: string,
  rawSkillPath: string,
  logger: Logger
): Promise<DownloadSummary> {
  return new SkillDownloader(client, cwd, logger).download(rawSkillPath);
}

function resolveLocalTarget(localRoot: string, skillPath: string, entry: BitbucketEntry): string {
  const relativePath = entry.path === skillPath ? "" : entry.path.slice(skillPath.length + 1);
  return resolveInside(localRoot, relativePath);
}
