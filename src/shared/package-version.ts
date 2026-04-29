import { readFileSync } from "node:fs";

import { SkillSyncError } from "./errors.js";

interface PackageMetadata {
  version: string;
}

export function readPackageVersion(
  packageFile = new URL("../../../package.json", import.meta.url)
): string {
  const rawPackage = readFileSync(packageFile, "utf8");
  const parsed = JSON.parse(rawPackage) as unknown;

  if (!hasPackageVersion(parsed)) {
    throw new SkillSyncError("package.json is missing a valid version field.");
  }

  return parsed.version;
}

function hasPackageVersion(value: unknown): value is PackageMetadata {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    typeof value.version === "string"
  );
}
