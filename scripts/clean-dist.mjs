import { rmSync } from "node:fs";
import { resolve } from "node:path";

const targetDir = process.argv[2] ?? "dist";

rmSync(resolve(targetDir), { force: true, recursive: true });
