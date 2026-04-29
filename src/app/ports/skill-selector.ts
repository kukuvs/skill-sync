export interface SkillSelectorPort {
  selectMany(items: string[], title: string): Promise<string[]>;
}
