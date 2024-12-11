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
    tree: SkillTree<T> | T,
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
        let result = skillTree.nextSkills
          .flatMap((el: SkillTree<T> | T) => this._getPossibleToUnlock(el))
          .filter((el: SkillTree<T> | T | null) => el !== null);
        return result.length !== 0 ? result : null;
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

  private isSkillTree(node: SkillTree<T> | T): node is SkillTree<T> {
    return (node as SkillTree<T>).skill !== undefined;
  }

  private _unlockByKey(
    treeEl: SkillTree<T>,
    findKey: string,
    findData: any,
    setUnlock: boolean = true,
    skipLocked: boolean = false
  ): void {
    const queue: Array<SkillTree<T> | T> = [treeEl];

    while (queue.length > 0) {
      const currentNode = queue.shift()!; // Dequeue the first element

      if (this.isSkillTree(currentNode)) {
        // If node has 'skill'
        const skillData = currentNode.skill;

        if (findKey in skillData && skillData[findKey] === findData) {
          // Found the matching node
          currentNode.skill.isUnlocked = setUnlock; // Assuming 'isUnlocked' is a property of SkillTree
          return; // Exit after finding the first match
        }

        // Enqueue child nodes for further traversal
        if (skipLocked) {
          if (skillData.isUnlocked) {
            currentNode.nextSkills.forEach((child) => {
              if (this.isSkillTree(child)) {
                queue.push(child);
              }
            });
          }
        } else {
          currentNode.nextSkills.forEach((child) => {
            if (this.isSkillTree(child)) {
              queue.push(child);
            }
          });
        }
      } else {
        // If node does not have 'skill', assume it's of type T
        const dataNode = currentNode as any; // Replace 'any' with actual type if known

        if (dataNode[findKey] === findData) {
          dataNode.isUnlocked = setUnlock; // Assuming 'isUnlocked' exists on T
          return; // Exit after finding the first match
        }
      }
    }
    throw new Error("Not found");
  }

  public setUnlockedByKey(find: Object) {
    const findKey = Object.keys(find);
    const findValues = Object.values(find);

    if (findKey.length !== 1) {
      throw new Error("You can pas only one key");
    }

    this._unlockByKey(this.skillTree, findKey[0], findValues[0]);
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
unlocks.setUnlockedByKey({ name: "ChildSkill1" });

console.log(JSON.stringify(unlocks.skillTree, null, 2));
console.log(JSON.stringify(unlocks.getPossibleToUnlock(), null, 2));

export default Unlocks;
