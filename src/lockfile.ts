import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { SkillSyncError } from "./errors.js";
import { normalizeSkillPath } from "./paths.js";

export interface SkillLock {
  skills: string[];
}

const lockFileName = "skill-lock.json";

export function getLockFilePath(cwd: string): string {
  return path.join(cwd, lockFileName);
}

export async function readSkillLock(cwd: string): Promise<SkillLock> {
  const lockPath = getLockFilePath(cwd);

  try {
    const content = await readFile(lockPath, "utf8");
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

export async function writeSkillLock(cwd: string, lock: SkillLock): Promise<void> {
  const lockPath = getLockFilePath(cwd);
  await mkdir(path.dirname(lockPath), { recursive: true });
  await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`, "utf8");
}

export async function addSkillsToLock(cwd: string, skillPaths: string[]): Promise<SkillLock> {
  const lock = await readSkillLock(cwd);
  const seen = new Set(lock.skills);

  for (const skillPath of skillPaths.map(normalizeSkillPath)) {
    if (!seen.has(skillPath)) {
      lock.skills.push(skillPath);
      seen.add(skillPath);
    }
  }

  await writeSkillLock(cwd, lock);
  return lock;
}

function isSkillLock(value: unknown): value is SkillLock {
  if (typeof value !== "object" || value === null || !("skills" in value)) {
    return false;
  }

  const skills = value.skills;
  return Array.isArray(skills) && skills.every((item) => typeof item === "string");
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
