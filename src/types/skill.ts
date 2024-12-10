export interface UnlockData {
  isUnlocked: boolean;
}

export interface SkillTree<SkillData extends UnlockData> {
  skill: SkillData;
  nextSkills: Array<SkillTree<SkillData> | SkillData>;
}
