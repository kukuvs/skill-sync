import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { SkillLockSnapshot, SkillLockStorePort } from "../app/ports/skill-lock-store.js";
import { SkillSyncError } from "../shared/errors.js";
import { normalizeSkillPath } from "../shared/skill-path.js";

const lockFileName = "skill-lock.json";

export class SkillLockStore implements SkillLockStorePort {
  constructor(private readonly cwd: string) {}

  get path(): string {
    return path.join(this.cwd, lockFileName);
  }

  async read(): Promise<SkillLockSnapshot> {
    try {
      const content = await readFile(this.path, "utf8");
      const parsed = JSON.parse(content) as unknown;

      if (!isSkillLock(parsed)) {
        throw new SkillSyncError(`${lockFileName} must contain a "skills" string array.`);
      }

      return {
        skills: parsed.skills.map(normalizeSkillPath)
      };
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return { skills: [] };
      }

      throw error;
    }
  }

  async write(lock: SkillLockSnapshot): Promise<void> {
    await mkdir(path.dirname(this.path), { recursive: true });
    await writeFile(this.path, `${JSON.stringify(lock, null, 2)}\n`, "utf8");
  }

  async add(skillPaths: string[]): Promise<SkillLockSnapshot> {
    const lock = await this.read();
    const seen = new Set(lock.skills);

    for (const skillPath of skillPaths.map(normalizeSkillPath)) {
      if (!seen.has(skillPath)) {
        lock.skills.push(skillPath);
        seen.add(skillPath);
      }
    }

    await this.write(lock);
    return lock;
  }
}

function isSkillLock(value: unknown): value is SkillLockSnapshot {
  if (typeof value !== "object" || value === null || !("skills" in value)) {
    return false;
  }

  const skills = value.skills;
  return Array.isArray(skills) && skills.every((item) => typeof item === "string");
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
