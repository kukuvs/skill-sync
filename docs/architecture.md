# Architecture

## Design goals

`skill-sync` is built around a small number of explicit boundaries:

- `cli` parses flags, env, prompts, and command intent.
- `app` owns one use-case per file, plus the ports they depend on.
- `infrastructure` owns Bitbucket transport, local file writes, lock storage, and terminal adapters that implement those ports.
- `shared` keeps cross-cutting utilities such as path safety, errors, logging, and package metadata.

The command layer stays thin: it loads runtime config, asks a factory for the right use-case, and hands off control. The app layer does not know Bitbucket pagination details, and the infrastructure layer does not decide business flow. That separation keeps changes local instead of growing a single service object or a loosely typed dependency bag.

## Data flow

```text
skill-sync add <path>
  -> load runtime config
  -> SkillSyncUseCaseFactory.createAddSkillUseCase()
  -> AddSkillUseCase.execute()
  -> SkillDownloader.download()
  -> replace .skill/<path>
  -> SkillLockStore.add()
```

```text
skill-sync sync
  -> load runtime config
  -> SkillSyncUseCaseFactory.createSyncSkillsUseCase()
  -> SyncSkillsUseCase.execute()
  -> SkillLockStore.read()
  -> replace every skill directory sequentially
```

```text
skill-sync search [filter]
  -> load runtime config
  -> SkillSyncUseCaseFactory.createSearchSkillsUseCase()
  -> SearchSkillsUseCase.execute()
  -> BitbucketSkillCatalog.listCandidates()
  -> update skill-lock.json
  -> download selected skills
```

## Bitbucket API

The client uses Bitbucket Cloud REST paths in this shape:

```text
https://api.bitbucket.org/2.0/repositories/<workspace>/<repo>/src/<ref>/<path>
```

Directory responses are paginated and collected until `next` is absent. File responses are downloaded as `application/octet-stream`.

## Local writes

Downloaded paths are resolved through `resolveInside()`. Any path that would escape `.skill/<skill-path>` is rejected before writing.

Each download is staged under `.skill/<parent>/.tmp-skill-sync-*`. After all files are written successfully, the previous skill directory is removed and the staging directory is renamed into place. If a download fails, the staging directory is cleaned up and the existing skill directory is left unchanged.

Because replacement is atomic at the skill directory level, files deleted upstream do not remain as stale local files.

## Catalog filtering

`search` uses `BitbucketSkillCatalog` instead of exposing every directory. Directories with files are considered real skill candidates; empty leaf directories are also shown because Bitbucket repositories sometimes start with placeholder skills. Pure grouping directories with only child directories are skipped.

## Scaling points

Near-term extensions can be added without changing the whole project:

- Auth providers can be added behind `loadConfig()`.
- Parallel downloads can be introduced inside `SkillDownloader` with a small concurrency limit.
- Bitbucket Server support can live beside the current Bitbucket Cloud client.
- Richer search metadata can be added by returning typed tree nodes instead of plain paths.
- Alternate lock storage backends can be introduced by swapping the store implementation in `SkillSyncContext`.
