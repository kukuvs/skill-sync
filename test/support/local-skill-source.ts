import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import type { BitbucketEntry } from "../../src/bitbucket.js";
import type { SkillSource } from "../../src/downloader.js";

export class LocalSkillSource implements SkillSource {
  constructor(private readonly rootDir: string) {}

  async downloadFile(filePath: string): Promise<Uint8Array> {
    return readFile(this.resolveFixturePath(filePath));
  }

  async listDirectory(directoryPath: string): Promise<BitbucketEntry[]> {
    const localPath = this.resolveFixturePath(directoryPath);
    const entries = await readdir(localPath, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isDirectory() || entry.isFile())
      .map((entry): BitbucketEntry => {
        const type = entry.isDirectory() ? "commit_directory" : "commit_file";

        return {
          path: [directoryPath, entry.name].filter(Boolean).join("/"),
          type
        };
      })
      .sort((left, right) => left.path.localeCompare(right.path));
  }

  private resolveFixturePath(relativePath: string): string {
    const resolvedRoot = path.resolve(this.rootDir);
    const resolvedTarget = path.resolve(resolvedRoot, ...relativePath.split("/").filter(Boolean));
    const boundary = resolvedRoot.endsWith(path.sep) ? resolvedRoot : `${resolvedRoot}${path.sep}`;

    if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(boundary)) {
      throw new Error("Fixture path escapes source root.");
    }

    return resolvedTarget;
  }
}
