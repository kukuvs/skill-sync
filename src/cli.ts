#!/usr/bin/env node

import { Command } from "commander";

import { addCommand } from "./cli/commands/add-command.js";
import { searchCommand } from "./cli/commands/search-command.js";
import { syncCommand } from "./cli/commands/sync-command.js";
import type { CliOptions } from "./cli/runtime-config.js";
import { SkillSyncError, toErrorMessage } from "./shared/errors.js";
import { consoleLogger } from "./shared/logger.js";
import { readPackageVersion } from "./shared/package-version.js";

const program = new Command();

program
  .name("skill-sync")
  .description("Sync skills from a Bitbucket repository into the current project.")
  .version(readPackageVersion())
  .option("--repo <url>", "Bitbucket repository URL")
  .option("--token <token>", "Bitbucket HTTP access token")
  .option("--ref <ref>", "Bitbucket branch, tag or commit")
  .option("--cwd <path>", "Project directory", process.cwd());

program
  .command("add")
  .argument("<skill-path>", "Skill path inside the Bitbucket repository")
  .description("Add a skill to skill-lock.json and download it")
  .action((skillPath: string) => run((options) => addCommand(skillPath, options, consoleLogger)));

program
  .command("sync")
  .description("Download every skill listed in skill-lock.json")
  .action(() => run((options) => syncCommand(options, consoleLogger)));

program
  .command("search")
  .argument("[filter]", "Optional text filter")
  .description("Search Bitbucket directories and select skills interactively")
  .action((filter: string | undefined) =>
    run((options) => searchCommand(filter, options, consoleLogger))
  );

program.parseAsync(process.argv).catch((error: unknown) => {
  handleFailure(error);
});

async function run(handler: (options: CliOptions) => Promise<void>): Promise<void> {
  try {
    await handler(program.opts<CliOptions>());
  } catch (error) {
    handleFailure(error);
  }
}

function handleFailure(error: unknown): void {
  const prefix = error instanceof SkillSyncError ? "error" : "unexpected error";
  consoleLogger.error(`${prefix}: ${toErrorMessage(error)}`);
  process.exitCode = 1;
}
