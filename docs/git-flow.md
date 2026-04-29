# Git Flow

This repository uses Git Flow naming and responsibilities.

## Branches

`main` is the stable production branch. Only release merges and hotfix merges should land here.

`develop` is the integration branch. Feature branches start here and merge back here.

`feature/*` branches hold regular product work:

```bash
git switch develop
git pull
git switch -c feature/bitbucket-search
```

`release/*` branches prepare a version for `main`:

```bash
git switch develop
git switch -c release/0.2.0
```

`hotfix/*` branches start from `main` when a production fix cannot wait for the next release:

```bash
git switch main
git pull
git switch -c hotfix/token-error-message
```

## Merge policy

- Feature branches merge into `develop`.
- Release branches merge into `main` and back into `develop`.
- Hotfix branches merge into `main` and back into `develop`.
- Keep branches task-scoped and short-lived.
- Run `npm run check` before opening a merge request.

## Commit examples

Use Conventional Commits:

```text
feat(cli): add recursive Bitbucket skill download
fix(lockfile): keep insertion order when adding duplicate skills
docs(flow): document release and hotfix branches
test(paths): cover unsafe skill path rejection
chore(tooling): add eslint and prettier configs
```

Prefer small commits with a single reason to exist. If a commit title needs "and", split it.
