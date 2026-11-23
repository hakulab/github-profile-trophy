# Contribution Guide

## Environment

- Node.js and pnpm (or enter the Nix dev shell with `nix develop`)
- [Cloudflare Workers](https://workers.cloudflare.com/) (`wrangler`)
- GitHub GraphQL API v4

## Local Run

Create a `.dev.vars` file in the project root directory and add your GitHub
token (see [env-example](./env-example)). Grant the `read:user` and
`public_repo` scopes (or `repo` to include private contributions).

```properties
GITHUB_TOKEN1=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GITHUB_TOKEN2=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
# PAT_1 / PAT_2 are also accepted as aliases.

# Optional:
# GITHUB_API=https://github.example.com/api/graphql
# DEFAULT_REPO_OWNERS=org-a,org-b
# WHITELIST=alice,bob
```

Run the local Workers dev server:

```sh
pnpm dev
```

Open localhost from your browser:

<http://localhost:8787/?username=alice>

## Editor config

Read [.editorconfig](./.editorconfig).

## Pull Requests

Pull requests are always welcome. In general, they should address a single
concern in as few changed lines as possible. For changes that address core
functionality, it is best to open an issue to discuss your proposal first.

## What to do before contributing

### 1. Run lint and typecheck

```sh
pnpm lint
pnpm typecheck
```

### 2. Run pre-commit hooks

```sh
nix develop -c run-hooks
```

### 3. Run tests

```sh
pnpm test
```
