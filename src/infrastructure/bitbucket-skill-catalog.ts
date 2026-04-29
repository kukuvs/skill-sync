import type { SkillCatalogPort } from "../app/ports/skill-catalog.js";
import type { BitbucketEntry } from "./bitbucket-client.js";

interface SkillCatalogSource {
  listDirectory(directoryPath: string): Promise<BitbucketEntry[]>;
}

export class BitbucketSkillCatalog implements SkillCatalogPort {
  constructor(private readonly source: SkillCatalogSource) {}

  async listCandidates(): Promise<string[]> {
    const result: string[] = [];
    const stack = [""];

    while (stack.length > 0) {
      const current = stack.pop() ?? "";
      const entries = await this.source.listDirectory(current);
      const directories = entries.filter((entry) => entry.type === "commit_directory");
      const hasFiles = entries.some((entry) => entry.type === "commit_file");

      if (current.length > 0 && (hasFiles || directories.length === 0)) {
        result.push(current);
      }

      for (const directory of directories) {
        stack.push(directory.path);
      }
    }

    return result.sort((left, right) => left.localeCompare(right));
  }
}
