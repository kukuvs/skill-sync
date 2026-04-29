import path from "node:path";

import { SkillSyncError } from "./errors.js";

export function normalizeSkillPath(rawPath: string): string {
  const normalized = rawPath
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\/+|\/+$/g, "");

  if (normalized.length === 0) {
    throw new SkillSyncError("Skill path is empty.");
  }

  const segments = normalized.split("/").filter(Boolean);
  const hasUnsafeSegment = segments.some(
    (segment) => segment === "." || segment === ".." || segment.includes("\0")
  );

  if (hasUnsafeSegment) {
    throw new SkillSyncError(`Skill path "${rawPath}" contains an unsafe segment.`);
  }

  return segments.join("/");
}

export function resolveInside(baseDir: string, relativePath: string): string {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, relativePath);
  const boundary = resolvedBase.endsWith(path.sep) ? resolvedBase : `${resolvedBase}${path.sep}`;

  if (resolvedTarget !== resolvedBase && !resolvedTarget.startsWith(boundary)) {
    throw new SkillSyncError(`Refusing to write outside ${resolvedBase}.`);
  }

  return resolvedTarget;
}

export function toPosixPath(value: string): string {
  return value.replaceAll(path.sep, "/");
}
