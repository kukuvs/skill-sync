export interface SkillCatalogPort {
  listCandidates(): Promise<string[]>;
}
