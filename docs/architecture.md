# Architecture

## Design goals

`skill-sync` is built around a small number of explicit boundaries:

- CLI commands parse intent and coordinate work.
- `BitbucketClient` owns the REST API details.
- `downloader` maps Bitbucket entries to local files.
- `lockfile` owns `skill-lock.json` parsing and writing.
- `paths` keeps path normalization and write-safety checks in one place.

The command layer does not know Bitbucket pagination details, and the API layer does not write to disk. That separation keeps the CLI easy to extend without turning command handlers into large scripts.

## Data flow

```text
skill-sync add <path>
  -> normalize skill path
  -> load Bitbucket config
  -> list Bitbucket directory recursively
  -> download files into a staging directory
  -> replace .skill/<path>
  -> add path to skill-lock.json
```

```text
skill-sync sync
  -> read skill-lock.json
  -> load Bitbucket config only when there is work to do
  -> replace every skill directory sequentially
```

```text
skill-sync search [filter]
  -> list Bitbucket skill candidates recursively
  -> filter locally
  -> select many entries
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

`search` uses `listSkillCandidates()` instead of exposing every directory. Directories with files are considered real skill candidates; empty leaf directories are also shown because Bitbucket repositories sometimes start with placeholder skills. Pure grouping directories with only child directories are skipped.

## Scaling points

Near-term extensions can be added without changing the whole project:

- Auth providers can be added behind `loadConfig()`.
- Parallel downloads can be introduced inside `downloader` with a small concurrency limit.
- Bitbucket Server support can live beside the current Bitbucket Cloud client.
- Richer search metadata can be added by returning typed tree nodes instead of plain paths.
