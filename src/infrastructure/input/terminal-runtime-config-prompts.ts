import type { RuntimeConfigPrompts } from "../../cli/runtime-config.js";
import { TerminalSecretPrompt } from "./terminal-secret-prompt.js";
import { TerminalTextPrompt } from "./terminal-text-prompt.js";

export class TerminalRuntimeConfigPrompts implements RuntimeConfigPrompts {
  constructor(
    private readonly textPrompt: TerminalTextPrompt = new TerminalTextPrompt(),
    private readonly secretPrompt: TerminalSecretPrompt = new TerminalSecretPrompt()
  ) {}

  askSecret(question: string): Promise<string> {
    return this.secretPrompt.ask(question);
  }

  askText(question: string): Promise<string> {
    return this.textPrompt.ask(question);
  }
}
