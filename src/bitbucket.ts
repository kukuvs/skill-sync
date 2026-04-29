import { SkillSyncError } from "./errors.js";
import type { BitbucketRepo } from "./config.js";

export interface BitbucketEntry {
  path: string;
  type: "commit_file" | "commit_directory";
}

interface BitbucketPage {
  next?: string;
  values?: unknown[];
}

interface BitbucketClientOptions {
  ref: string;
  repo: BitbucketRepo;
  token: string;
}

export class BitbucketClient {
  private readonly apiBase: string;

  constructor(private readonly options: BitbucketClientOptions) {
    const { workspace, repoSlug } = options.repo;
    this.apiBase = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}`;
  }

  async listDirectory(directoryPath: string): Promise<BitbucketEntry[]> {
    const entries: BitbucketEntry[] = [];
    let nextUrl: string | undefined = this.sourceUrl(directoryPath, { pagelen: "100" });

    while (nextUrl) {
      const page = parsePage(await this.getJson(nextUrl));
      const values = page.values ?? [];

      for (const value of values) {
        const entry = parseEntry(value);

        if (entry) {
          entries.push(entry);
        }
      }

      nextUrl = page.next;
    }

    return entries;
  }

  async downloadFile(filePath: string): Promise<Uint8Array> {
    const response = await this.request(this.sourceUrl(filePath), "application/octet-stream");
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      throw new SkillSyncError(`"${filePath}" is not a file in Bitbucket.`);
    }

    return new Uint8Array(await response.arrayBuffer());
  }

  async listDirectoriesRecursive(rootPath = ""): Promise<string[]> {
    const result: string[] = [];
    const stack = [rootPath];

    while (stack.length > 0) {
      const current = stack.pop() ?? "";
      const entries = await this.listDirectory(current);

      for (const entry of entries) {
        if (entry.type === "commit_directory") {
          result.push(entry.path);
          stack.push(entry.path);
        }
      }
    }

    return result.sort((left, right) => left.localeCompare(right));
  }

  private sourceUrl(pathname: string, query: Record<string, string> = {}): string {
    const encodedPath = encodePath(pathname);
    const sourcePath =
      encodedPath.length > 0
        ? `${encodeURIComponent(this.options.ref)}/${encodedPath}`
        : `${encodeURIComponent(this.options.ref)}/`;
    const url = new URL(`${this.apiBase}/src/${sourcePath}`);

    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }

    return url.toString();
  }

  private async getJson(url: string): Promise<unknown> {
    const response = await this.request(url, "application/json");
    return JSON.parse(await response.text()) as unknown;
  }

  private async request(url: string, accept: string): Promise<Response> {
    const response = await fetch(url, {
      headers: {
        Accept: accept,
        Authorization: `Bearer ${this.options.token}`
      }
    });

    if (response.ok) {
      return response;
    }

    if (response.status === 401 || response.status === 403) {
      throw new SkillSyncError("Bitbucket rejected the token or access is not allowed.");
    }

    if (response.status === 404) {
      throw new SkillSyncError("Bitbucket path was not found.");
    }

    throw new SkillSyncError(`Bitbucket request failed with HTTP ${response.status}.`);
  }
}

function parsePage(value: unknown): BitbucketPage {
  if (typeof value !== "object" || value === null) {
    throw new SkillSyncError("Bitbucket returned an invalid directory response.");
  }

  const record = value as { next?: unknown; values?: unknown };
  const page: BitbucketPage = {};

  if (Array.isArray(record.values)) {
    page.values = record.values;
  }

  if (typeof record.next === "string") {
    page.next = record.next;
  }

  return page;
}

function parseEntry(value: unknown): BitbucketEntry | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const record = value as { path?: unknown; type?: unknown };

  if (typeof record.path !== "string") {
    return undefined;
  }

  if (record.type !== "commit_file" && record.type !== "commit_directory") {
    return undefined;
  }

  return {
    path: record.path,
    type: record.type
  };
}

function encodePath(pathname: string): string {
  return pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}
