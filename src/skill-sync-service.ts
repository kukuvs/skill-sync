import { BitbucketClient } from "./bitbucket.js";
import { listSkillCandidates, type SkillCatalogSource } from "./catalog.js";
import type { RuntimeConfig } from "./config.js";
import type { DownloadSummary, SkillSource } from "./downloader.js";
import { SkillDownloader } from "./downloader.js";
import { SkillLockStore, type SkillLock } from "./lockfile.js";
import type { Logger } from "./logger.js";
import { normalizeSkillPath } from "./paths.js";
import { selectMany } from "./selector.js";

export interface SkillDownloaderLike {
  download(skillPath: string): Promise<DownloadSummary>;
}

export interface SkillLockStoreLike {
  add(skillPaths: string[]): Promise<SkillLock>;
  read(): Promise<SkillLock>;
}

interface SkillSyncClient extends SkillSource, SkillCatalogSource {}

export interface SkillSyncServiceDependencies {
  createClient(config: RuntimeConfig): SkillSyncClient;
  createDownloader(client: SkillSyncClient, cwd: string, logger: Logger): SkillDownloaderLike;
  createLockStore(cwd: string): SkillLockStoreLike;
  listCandidates(source: SkillCatalogSource): Promise<string[]>;
  selectMany(items: string[], title: string): Promise<string[]>;
}

const defaultDependencies: SkillSyncServiceDependencies = {
  createClient(config) {
    return new BitbucketClient(config);
  },
  createDownloader(client, cwd, logger) {
    return new SkillDownloader(client, cwd, logger);
  },
  createLockStore(cwd) {
    return new SkillLockStore(cwd);
  },
  listCandidates(source) {
    return listSkillCandidates(source);
  },
  selectMany(items, title) {
    return selectMany(items, title);
  }
};

export class SkillSyncService {
  private readonly client: SkillSyncClient;
  private readonly lockStore: SkillLockStoreLike;

  constructor(
    private readonly config: RuntimeConfig,
    private readonly logger: Logger,
    private readonly dependencies: SkillSyncServiceDependencies = defaultDependencies
  ) {
    this.client = dependencies.createClient(config);
    this.lockStore = dependencies.createLockStore(config.cwd);
  }

  async add(skillPath: string): Promise<void> {
    const normalizedSkillPath = normalizeSkillPath(skillPath);
    const summary = await this.createDownloader().download(normalizedSkillPath);

    await this.lockStore.add([normalizedSkillPath]);
    this.logger.info(
      `Added "${summary.skillPath}" and downloaded ${summary.files} file(s) into .skill/.`
    );
  }

  async sync(): Promise<void> {
    const lock = await this.lockStore.read();

    if (lock.skills.length === 0) {
      this.logger.warn("skill-lock.json is missing or contains no skills. Nothing to sync.");
      return;
    }

    const downloader = this.createDownloader();
    let files = 0;

    for (const skillPath of lock.skills) {
      this.logger.info(`Syncing ${skillPath}...`);
      const summary = await downloader.download(skillPath);
      files += summary.files;
    }

    this.logger.info(`Synced ${lock.skills.length} skill(s), ${files} file(s) total.`);
  }

  async search(filter: string | undefined): Promise<void> {
    const allDirectories = await this.dependencies.listCandidates(this.client);
    const normalizedFilter = filter?.trim().toLocaleLowerCase();
    const candidates = normalizedFilter
      ? allDirectories.filter((item) => item.toLocaleLowerCase().includes(normalizedFilter))
      : allDirectories;

    if (candidates.length === 0) {
      this.logger.warn("No skills were found.");
      return;
    }

    const selected = await this.dependencies.selectMany(candidates, "Available skills");

    if (selected.length === 0) {
      this.logger.warn("No skills selected.");
      return;
    }

    await this.lockStore.add(selected);

    const downloader = this.createDownloader();
    for (const skillPath of selected) {
      this.logger.info(`Downloading ${skillPath}...`);
      await downloader.download(skillPath);
    }

    this.logger.info(`Added and downloaded ${selected.length} skill(s).`);
  }

  private createDownloader(): SkillDownloaderLike {
    return this.dependencies.createDownloader(this.client, this.config.cwd, this.logger);
  }
}
