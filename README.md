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
npm install
npm run build
```

The package exposes the `skill-sync` binary from `dist/cli.js`.

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

## Repository layout

```text
src/
  cli.ts
  bitbucket.ts
  config.ts
  downloader.ts
  lockfile.ts
  paths.ts
  prompt.ts
  selector.ts
  commands/
test/
docs/
tmp/
```

Temporary local work belongs in `tmp/`; the directory is ignored by git.

## Quality checks

```bash
npm run lint
npm run format:check
npm run test
```

Tests compile the TypeScript project and run Node's built-in test runner against `dist/test`.

## More docs

- [Architecture](docs/architecture.md)
- [Git Flow](docs/git-flow.md)
