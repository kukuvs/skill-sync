# skill-sync

`skill-sync` is a TypeScript CLI for downloading shared skills from a Bitbucket repository into a local project. It keeps the requested skills in `skill-lock.json` and writes downloaded files under `.skill/`.

## Why this stack

The project is a CLI package, so the stack is deliberately small:

- TypeScript for readable, typed boundaries.
- Node.js 18+ native `fetch`, `fs`, `path`, and `readline`.
- `commander` as the CLI command framework.
- ESLint and Prettier for consistent project hygiene.

This keeps runtime behavior easy to inspect and avoids a dependency tree that would be larger than the tool itself.

## Install for development

```bash
pnpm install
pnpm run build
```

The package exposes the `skill-sync` binary from `dist/src/cli.js`.

## Configuration

`skill-sync` reads Bitbucket settings from flags first, then environment variables, then prompts:

```bash
export BITBUCKET_TOKEN=xxx
export BITBUCKET_REPO_URL=https://bitbucket.org/workspace/skills-repo
export BITBUCKET_REF=main
```

The token is sent as:

```text
Authorization: Bearer <token>
```

In non-interactive shells, set `BITBUCKET_TOKEN`; secret prompts are rejected without a TTY so tokens are not echoed into logs. `--token` exists for controlled local use, but environment variables are safer for repeatable runs.

`--ref` has priority over `BITBUCKET_REF`. When neither is set, `main` is used.

## Commands

```bash
npx skill-sync add разработка/x-uikit
npx skill-sync sync
npx skill-sync search
npx skill-sync search uikit
```

Global options:

```bash
skill-sync --repo https://bitbucket.org/workspace/skills-repo --ref main sync
skill-sync --cwd ./another-project add тестирование/jest-config
```

## Lock file

`skill-lock.json` lives in the project where the command is executed:

```json
{
  "skills": ["разработка/x-uikit", "разработка/x-uikit/button", "тестирование/jest-config"]
}
```

`add` preserves insertion order and skips duplicates. `sync` prints a warning and exits cleanly when the lock file is missing or empty.

`add` updates the lock file only after the skill has downloaded successfully. Downloads are staged first and then replace the target `.skill/<skill-path>` directory, so stale files from older upstream versions are removed.

The codebase is split into explicit layers: `cli` handles user input, `app` owns use-cases and ports, `infrastructure` implements adapters for Bitbucket/filesystem/input, and `shared` keeps cross-cutting utilities small and obvious.

## Search behavior

`search` walks Bitbucket directories and shows skill candidates rather than every grouping folder. A directory is treated as a candidate when it contains files or has no child directories. This keeps top-level groups such as `разработка` out of the default selection list while still supporting nested skills like `разработка/x-uikit/button`.

## Repository layout

```text
src/
  cli.ts
  app/
    ports/
  cli/
  infrastructure/
  shared/
scripts/
test/
  app/
  cli/
  e2e/
  infrastructure/
  shared/
docs/
tmp/
```

Temporary local work belongs in `tmp/`; the directory is ignored by git.

## Quality checks

```bash
pnpm run lint
pnpm run format:check
pnpm run build
pnpm run test
```

Tests compile the TypeScript project and run Node's built-in test runner against the full `dist/test/**` tree.

## More docs

- [Architecture](docs/architecture.md)
- [Git Flow](docs/git-flow.md)
