import readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";

export class TerminalTextPrompt {
  async ask(question: string): Promise<string> {
    const rl = readline.createInterface({ input, output });

    try {
      return await new Promise<string>((resolve) => {
        rl.question(question, (answer) => resolve(answer.trim()));
      });
    } finally {
      rl.close();
    }
  }
}
