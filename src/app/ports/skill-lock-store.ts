export interface SkillLockSnapshot {
  skills: string[];
}

export interface SkillLockStorePort {
  add(skillPaths: string[]): Promise<SkillLockSnapshot>;
  read(): Promise<SkillLockSnapshot>;
}
