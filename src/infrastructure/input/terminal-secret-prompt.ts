import { stdin as input, stdout as output } from "node:process";

import { SkillSyncError } from "../../shared/errors.js";

export class TerminalSecretPrompt {
  async ask(question: string): Promise<string> {
    if (!input.isTTY) {
      throw new SkillSyncError("Secret prompts require a TTY. Set BITBUCKET_TOKEN instead.");
    }

    output.write(question);
    input.setRawMode(true);
    input.resume();

    return await new Promise<string>((resolve, reject) => {
      let value = "";

      const cleanup = (): void => {
        input.setRawMode(false);
        input.off("data", onData);
        output.write("\n");
      };

      const onData = (chunk: Buffer): void => {
        const key = chunk.toString("utf8");

        if (key === "\u0003") {
          cleanup();
          reject(new Error("Input cancelled."));
          return;
        }

        if (key === "\r" || key === "\n") {
          cleanup();
          resolve(value.trim());
          return;
        }

        if (key === "\b" || key === "\u007f") {
          value = value.slice(0, -1);
          return;
        }

        value += key;
      };

      input.on("data", onData);
    });
  }
}
