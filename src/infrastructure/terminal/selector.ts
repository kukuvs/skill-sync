import { stdin as input, stdout as output } from "node:process";

import { askText } from "./prompt.js";

export type SkillSelector = (items: string[], title: string) => Promise<string[]>;

export async function selectMany(items: string[], title: string): Promise<string[]> {
  if (items.length === 0) {
    return [];
  }

  if (!input.isTTY || !output.isTTY) {
    return selectByNumbers(items, title);
  }

  return selectWithKeyboard(items, title);
}

async function selectByNumbers(items: string[], title: string): Promise<string[]> {
  output.write(`${title}\n`);
  items.forEach((item, index) => {
    output.write(`${index + 1}. ${item}\n`);
  });

  const answer = await askText("Choose numbers separated by comma: ");
  const indexes = answer
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10) - 1)
    .filter((value) => Number.isInteger(value) && value >= 0 && value < items.length);

  return [...new Set(indexes)]
    .map((index) => items[index])
    .filter((item): item is string => Boolean(item));
}

async function selectWithKeyboard(items: string[], title: string): Promise<string[]> {
  input.setRawMode(true);
  input.resume();
  output.write("\x1b[?25l");

  return await new Promise<string[]>((resolve, reject) => {
    let cursor = 0;
    const selected = new Set<number>();

    const cleanup = (): void => {
      input.setRawMode(false);
      input.off("data", onData);
      output.write("\x1b[?25h");
      output.write("\n");
    };

    const render = (): void => {
      output.write("\x1b[2J\x1b[0;0H");
      output.write(`${title}\n`);
      output.write("Use arrows, Space to select, Enter to confirm.\n\n");

      items.forEach((item, index) => {
        const marker = selected.has(index) ? "[x]" : "[ ]";
        const pointer = index === cursor ? ">" : " ";
        output.write(`${pointer} ${marker} ${item}\n`);
      });
    };

    const onData = (chunk: Buffer): void => {
      const key = chunk.toString("utf8");

      if (key === "\u0003") {
        cleanup();
        reject(new Error("Selection cancelled."));
        return;
      }

      if (key === "\u001b[A") {
        cursor = cursor === 0 ? items.length - 1 : cursor - 1;
        render();
        return;
      }

      if (key === "\u001b[B") {
        cursor = cursor === items.length - 1 ? 0 : cursor + 1;
        render();
        return;
      }

      if (key === " ") {
        if (selected.has(cursor)) {
          selected.delete(cursor);
        } else {
          selected.add(cursor);
        }
        render();
        return;
      }

      if (key === "\r" || key === "\n") {
        cleanup();
        resolve([...selected].sort((left, right) => left - right).map((index) => items[index]!));
      }
    };

    input.on("data", onData);
    render();
  });
}
