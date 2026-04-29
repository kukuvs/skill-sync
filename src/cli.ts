#!/usr/bin/env node

import { Command } from "commander";

import { addCommand } from "./commands/add.js";
import { searchCommand } from "./commands/search.js";
import { syncCommand } from "./commands/sync.js";
import type { CliOptions } from "./config.js";
import { SkillSyncError, toErrorMessage } from "./errors.js";
import { consoleLogger } from "./logger.js";

const program = new Command();

program
  .name("skill-sync")
  .description("Sync skills from a Bitbucket repository into the current project.")
  .version("0.1.0")
  .option("--repo <url>", "Bitbucket repository URL")
  .option("--token <token>", "Bitbucket HTTP access token")
  .option("--ref <ref>", "Bitbucket branch, tag or commit", "main")
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
