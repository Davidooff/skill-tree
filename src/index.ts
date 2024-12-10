import { type SkillTree, type UnlockData } from "./types/skill";

interface PossibleUnlock<T> {
  skill: T;
  path: number[];
}

class Unlocks<T extends UnlockData> {
  skillTree: SkillTree<T>;

  constructor(unlocksTree: SkillTree<T>) {
    this.skillTree = unlocksTree;
  }

  public setUnlockedByPath(path: number[], isUnlocked: boolean): void {
    if (path[0] !== 0) {
      throw new Error("Path need to start from [0]");
    }
    path.shift();
    if (!path.length) {
      this.skillTree.skill.isUnlocked = isUnlocked;
    }
    this._setUnlockedByPath(this.skillTree, path, isUnlocked);
  }

  // Private recursive helper method
  private _setUnlockedByPath(
    tree: SkillTree<T>,
    path: number[],
    isUnlocked: boolean
  ): void {
    if (path.length === 0) {
      // No further navigation needed: update the current node
      tree.skill.isUnlocked = isUnlocked;
      return;
    }

    const [currentIndex, ...remainingPath] = path;
    const nextNode = tree.nextSkills[currentIndex];

    if (nextNode === undefined) throw new Error("path error");

    // Check if nextNode is a leaf skill or another SkillTree
    if (!("skill" in nextNode)) {
      // nextNode is a leaf skill
      if (remainingPath.length > 0) {
        throw new Error(
          "Path is too long: reached a leaf skill but still have more indices to navigate."
        );
      }
      // Update leaf skill
      nextNode.isUnlocked = isUnlocked;
    } else {
      // nextNode is another SkillTree; recurse down
      this._setUnlockedByPath(nextNode, remainingPath, isUnlocked);
    }
  }

  private _getPossibleToUnlock(skillTree: SkillTree<T> | T): T[] | T | null {
    if ("skill" in skillTree) {
      if (skillTree.skill.isUnlocked) {
        return skillTree.nextSkills
          .flatMap((el) => this._getPossibleToUnlock(el))
          .filter((el) => el !== null);
      } else {
        return skillTree.skill;
      }
    } else {
      if (skillTree.isUnlocked) {
        return null;
      } else {
        return skillTree;
      }
    }
  }

  public getPossibleToUnlock(): T[] | T | null {
    return this._getPossibleToUnlock(this.skillTree);
  }
}

interface MySkillData extends UnlockData {
  name: string;
}

const myTree: SkillTree<MySkillData> = {
  skill: { name: "RootSkill", isUnlocked: false },
  nextSkills: [
    {
      skill: { name: "ChildSkill1", isUnlocked: false },
      nextSkills: [
        { name: "GrandChildSkill1", isUnlocked: false },
        { name: "GrandChildSkill2", isUnlocked: false },
      ],
    },
    { name: "ChildSkill2", isUnlocked: false },
  ],
};

const unlocks = new Unlocks(myTree);

// Suppose we want to unlock the second grandchild of the first child skill: path is [0, 1]
unlocks.setUnlockedByPath([0], true);
unlocks.setUnlockedByPath([0, 0], true);

console.log(JSON.stringify(unlocks.skillTree, null, 2));
console.log(JSON.stringify(unlocks.getPossibleToUnlock(), null, 2));

export default Unlocks;
