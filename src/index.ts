import { type SkillTree, type UnlockData } from "./types/skill";

interface PossibleUnlock<T> {
  skill: T;
  path: number[];
}

class Unlocks<T extends UnlockData> {
  skillTree: SkillTree<T>;
  possibleToUnlock: PossibleUnlock<T>[];

  constructor(unlocksTree: SkillTree<T>) {
    this.skillTree = unlocksTree;
    this.possibleToUnlock = this.getPossibleToUnlock();
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

  public getPossibleToUnlock(): PossibleUnlock<T>[] {
    let result: PossibleUnlock<T>[] = [];
    let path: number[] = [0];
    while (true) {
      let current: SkillTree<T> | T | undefined = this.skillTree;
      if (path[0] !== 0) {
        break;
      }

      for (let i = 1; i < path.length; i++) {
        if ("nextSkills" in current && current.nextSkills) {
          current = current.nextSkills[i];
        }
      }

      if (current === undefined) {
        if (path.length === 1) {
          break;
        }
        path.pop();
        path[path.length - 1]++;
      } else if ("nextSkills" in current) {
        if (current.skill.isUnlocked) {
          path.push(0);
        } else {
          result.push({ skill: current.skill, path });
          path[path.length - 1]++;
        }
      } else if ("isUnlocked" in current) {
        if (!current.isUnlocked) {
          result.push({ skill: current, path });
          path[path.length - 1]++;
        }
      }
    }
    return result;
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
unlocks.setUnlockedByPath([0, 1], true);

console.log(JSON.stringify(unlocks.skillTree, null, 2));

export default Unlocks;
