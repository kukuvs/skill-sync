export interface SkillDownloadSummary {
  directories: number;
  files: number;
  skillPath: string;
}

export interface SkillDownloaderPort {
  download(skillPath: string): Promise<SkillDownloadSummary>;
}
