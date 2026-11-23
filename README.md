# GitHub Profile Trophy

Add dynamically generated GitHub stat trophies to your README, running on
Cloudflare Workers.

[![stargazers](https://img.shields.io/github/stars/ryo-ma/github-profile-trophy)](https://github.com/ryo-ma/github-profile-trophy/stargazers)
[![forks](https://img.shields.io/github/forks/ryo-ma/github-profile-trophy)](https://github.com/ryo-ma/github-profile-trophy/network/members)
[![issues](https://img.shields.io/github/issues/ryo-ma/github-profile-trophy)](https://github.com/ryo-ma/github-profile-trophy/issues)
[![license](https://img.shields.io/github/license/ryo-ma/github-profile-trophy)](https://github.com/ryo-ma/github-profile-trophy/blob/master/LICENSE)

## Quick Start

Add the following Markdown to your profile README, replacing `alice` with your
GitHub username and pointing the URL at your deployed Worker:

```markdown
[![trophy](https://your-worker.example.com/?username=alice)](https://github.com/hakulab/github-profile-trophy)
```

![GitHub Profile Trophy preview](https://user-images.githubusercontent.com/6661165/92327052-d99b9e00-f091-11ea-9a24-c7ec86982370.png)

## Query Parameters

`username` is required. All other parameters are optional:

| Parameter                     | Default   | Description                                                        |
| ----------------------------- | --------- | ------------------------------------------------------------------ |
| [`column`](#layout)           | `8`       | Maximum columns per row (`-1` adapts width to the trophy count)    |
| [`margin-h`](#margins)        | `0`       | Vertical margin between trophies in pixels                         |
| [`margin-w`](#margins)        | `0`       | Horizontal margin between trophies in pixels                       |
| [`no-bg`](#appearance)        | `false`   | Set `true` for a transparent background                            |
| [`no-frame`](#appearance)     | `false`   | Set `true` to hide trophy frames                                   |
| [`rank`](#filter-by-rank)     | all       | Comma-separated ranks to include or exclude (`-` prefix)           |
| [`repo-owners`](#multi-owner) | env value | Comma-separated additional repository owners (`repo_owners` alias) |
| [`row`](#layout)              | `3`       | Maximum rows (ignored when `column=-1`)                            |
| [`theme`](#themes)            | `default` | Color theme name                                                   |
| [`title`](#filter-by-title)   | all       | Comma-separated trophy titles to include or exclude (`-` prefix)   |

### Layout

Limit the grid with `column` (default `8`) and `row` (default `3`). Trophies
beyond `column * row` are hidden. Set `column=-1` to adapt the width to the
number of trophies (this ignores `row`).

```text
https://your-worker.example.com/?username=alice&row=2&column=3
https://your-worker.example.com/?username=alice&column=-1
```

![Row and column restriction](https://user-images.githubusercontent.com/6661165/91659474-c07f7400-eb0a-11ea-84f2-eb6b42547829.png)

### Margins

Add spacing between trophies with `margin-w` and `margin-h` (both default to
`0`):

```text
https://your-worker.example.com/?username=alice&column=3&margin-w=15&margin-h=15
```

![Example layout with margins](https://user-images.githubusercontent.com/6661165/93668677-ff309a80-fac8-11ea-8ae3-3e3e8adbef39.png)

### Appearance

Set `no-bg=true` for a transparent background and `no-frame=true` to hide the
frame around each trophy (both default to `false`):

```text
https://your-worker.example.com/?username=alice&no-bg=true&no-frame=true
```

![Transparent background example](https://github.com/user-attachments/assets/32d3b63b-7845-42cb-b71c-31abaa673bcb)

![Hide frames example](https://github.com/user-attachments/assets/54de15a3-d907-4a50-8117-170aae74d1cd)

### Filter by rank

Available ranks are `SECRET`, `SSS`, `SS`, `S`, `AAA`, `AA`, `A`, `B`, `C`, and
`?` (`UNKNOWN`). Include or exclude (`-` prefix) ranks with `rank`:

```text
https://your-worker.example.com/?username=alice&rank=S
https://your-worker.example.com/?username=alice&rank=S,AAA
https://your-worker.example.com/?username=alice&rank=-C,-B,-?
```

![Filter by S and AAA ranks](https://user-images.githubusercontent.com/6661165/91642657-1cdd8780-ea68-11ea-994b-4568a55cd22a.png)

### Multi-owner

Combine repository counts, stargazers, and `MultiLanguage` counts across the
primary `username` and additional GitHub users or organizations with
`repo-owners` (or its alias `repo_owners`), separated by commas. Up to 10
additional owners are included per request, deduplicated by repository name,
while account activity metrics (commits, PRs, issues, reviews, followers,
organizations, and account age) remain tied to `username`.

```text
https://your-worker.example.com/?username=alice&repo-owners=org-a,org-b
```

If the instance sets `DEFAULT_REPO_OWNERS`, pass an empty `?repo-owners=` (or
`?repo_owners=`) to opt out and aggregate only `username`:

```text
https://your-worker.example.com/?username=alice&repo-owners=
```

### Filter by title

Include specific trophies with `title`, or exclude them with a `-` prefix:

```text
https://your-worker.example.com/?username=alice&title=Followers
https://your-worker.example.com/?username=alice&title=Stars,Followers
https://your-worker.example.com/?username=alice&title=-Stars,-Followers
```

![Filter by Stars and Followers titles](https://user-images.githubusercontent.com/6661165/92317141-80ebe700-f038-11ea-8501-4015bfbb2cf4.png)

### Themes

Pass `theme=<name>` to apply a theme:

```text
https://your-worker.example.com/?username=alice&theme=onedark
```

Available themes (alphabetical):

| Theme                       | Theme                       | Theme                     |
| --------------------------- | --------------------------- | ------------------------- |
| [alduin](#alduin)           | [discord](#discord)         | [monokai](#monokai)       |
| [algolia](#algolia)         | [dracula](#dracula)         | [nord](#nord)             |
| [apprentice](#apprentice)   | [flat](#flat)               | [oldie](#oldie)           |
| [aura](#aura)               | [gitdimmed](#gitdimmed)     | [onedark](#onedark)       |
| [buddhism](#buddhism)       | [gruvbox](#gruvbox)         | [onestar](#onestar)       |
| [chalk](#chalk)             | [juicyfresh](#juicyfresh)   | [radical](#radical)       |
| [dark_dimmed](#dark_dimmed) | [kimbie_dark](#kimbie_dark) | [tokyonight](#tokyonight) |
| [dark_lover](#dark_lover)   | [matrix](#matrix)           |                           |
| [darkhub](#darkhub)         |                             |                           |

#### alduin

![alduin theme](https://user-images.githubusercontent.com/6661165/99085932-2a88bf00-260c-11eb-9b26-d2f125773831.png)

#### algolia

![algolia theme](https://user-images.githubusercontent.com/6661165/131685203-92a31101-2d93-4d18-b24a-d81a8bb012c5.png)

#### apprentice

![apprentice theme](https://user-images.githubusercontent.com/31789752/144701036-285cdd4b-d687-4ddc-95c2-7ccae9e25a1f.png)

#### aura

![aura theme](https://github.com/user-attachments/assets/18a2266c-9a88-4882-940d-162c0c4d36e0)

#### buddhism

![buddhism theme](https://user-images.githubusercontent.com/6661165/113709167-2412f500-971d-11eb-9ee5-0ab292cf8b4c.png)

#### chalk

![chalk theme](https://user-images.githubusercontent.com/6661165/94294003-1de7d300-ff9a-11ea-91d1-60417a4d919b.png)

#### dark_dimmed

![dark_dimmed theme](https://user-images.githubusercontent.com/31789752/147340893-655b9fa5-138f-4f29-91ec-2a17c93822d1.png)

#### dark_lover

![dark_lover theme](https://user-images.githubusercontent.com/31789752/152659041-de5b23cb-1be8-4e6b-b07b-726127ab8c3a.png)

#### darkhub

![darkhub theme](https://user-images.githubusercontent.com/6661165/102801126-249ab080-43f8-11eb-91c8-f56f94c35777.png)

#### discord

![discord theme](https://user-images.githubusercontent.com/6661165/122048628-7dce2480-ce1c-11eb-9792-1e600b384c4d.png)

#### dracula

![dracula theme](https://user-images.githubusercontent.com/6661165/92490273-c91f2b00-f22b-11ea-9481-b5daae4d7bc3.png)

#### flat

![flat theme](https://user-images.githubusercontent.com/6661165/92325601-039b9300-f087-11ea-983a-fce8133549ee.png)

#### gitdimmed

![gitdimmed theme](https://user-images.githubusercontent.com/6661165/131685406-799a864f-2691-4840-bb71-1db9c087a507.png)

#### gruvbox

![gruvbox theme](https://user-images.githubusercontent.com/6661165/92315152-e9c56600-f01c-11ea-9536-1bfbb158cfcb.png)

#### juicyfresh

![juicyfresh theme](https://user-images.githubusercontent.com/6661165/104810094-edbc8c80-5835-11eb-8c20-a76192a00728.png)

#### kimbie_dark

![kimbie_dark theme](https://user-images.githubusercontent.com/8161064/288417332-408705a4-ae9c-47fe-af1a-9fb08555f526.png)

#### matrix

![matrix theme](https://user-images.githubusercontent.com/31789752/141647414-15cfe279-af12-4746-a886-f494c25c096d.png)

#### monokai

![monokai theme](https://user-images.githubusercontent.com/6661165/93725426-2c289e80-fbea-11ea-96a4-f6490ccf2126.png)

#### nord

![nord theme](https://user-images.githubusercontent.com/6661165/94346857-7ab2be80-006a-11eb-9082-36d377ae2531.png)

#### oldie

![oldie theme](https://user-images.githubusercontent.com/6661165/113709581-a0a5d380-971d-11eb-8583-770dc4091ebf.png)

#### onedark

![onedark theme](https://user-images.githubusercontent.com/6661165/92327052-d99b9e00-f091-11ea-9a24-c7ec86982370.png)

#### onestar

![onestar theme](https://user-images.githubusercontent.com/6661165/122048400-2af46d00-ce1c-11eb-94e0-c2c6ddaf6819.png)

#### radical

![radical theme](https://user-images.githubusercontent.com/6661165/116633521-adbc8800-a994-11eb-97c4-e45a32721491.png)

#### tokyonight

![tokyonight theme](https://user-images.githubusercontent.com/6661165/135482087-27764d6f-53b4-4c2a-8473-32431d12660c.png)

## Ranks & Display

Ranks are `SSS`, `SS`, `S`, `AAA`, `AA`, `A`, `B`, `C`, `UNKNOWN` (`?`), and
`SECRET`.

| Rank       | Description                                                |
| ---------- | ---------------------------------------------------------- |
| SSS, SS, S | Hard-to-reach top ranks                                    |
| AAA, AA, A | Strong progress and a solid initial target                 |
| B, C       | Good progress underway                                     |
| UNKNOWN    | No qualifying activity yet (denoted by `?`)                |
| SECRET     | Rare trophies hidden until their unlock conditions are met |

![Secret rank trophy](https://github.com/user-attachments/assets/40461f38-a317-431c-93d2-a56c2e803cf3)

Each trophy card displays:

![Trophy display details](https://user-images.githubusercontent.com/6661165/91642962-6333e600-ea6a-11ea-83af-e371e996bfa6.png)

1. Aggregation target title.
2. Current rank.
3. Rank title.
4. Aggregated value.
5. Progress bar toward the next rank.

## Self-hosting on Cloudflare Workers

Self-hosting avoids shared GitHub API rate limits and lets you control caching,
default repository owners, and access restrictions.

### Setup

1. Fork this repository and update `routes` in `wrangler.toml` for your domain
   (or remove it to use the default `*.workers.dev` URL).

2. Generate a GitHub personal access token with `read:user` and `public_repo`
   scopes (use `repo` if you want private contributions counted).

3. Store the token as a Wrangler secret (and optionally a second token for
   rotation):

   ```sh
   pnpm wrangler secret put GITHUB_TOKEN1
   pnpm wrangler secret put GITHUB_TOKEN2
   ```

4. Deploy the Worker:

   ```sh
   pnpm deploy
   ```

5. Request your deployed endpoint:

   ```text
   https://<your-worker-domain>/?username=alice
   ```

### Environment Variables

Configure secrets with `wrangler secret put` and non-secret variables under
`[vars]` in `wrangler.toml` (or in `.dev.vars` for local development):

| Variable              | Required | Description                                                                                       |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `GITHUB_TOKEN1`       | No\*     | Primary GitHub personal access token (`PAT_1` is also accepted as an alias)                       |
| `GITHUB_TOKEN2`       | No\*     | Secondary GitHub personal access token for rotation (`PAT_2` is also accepted as an alias)        |
| `GITHUB_API`          | No       | GitHub GraphQL endpoint (defaults to `https://api.github.com/graphql`)                            |
| `DEFAULT_REPO_OWNERS` | No       | Comma-separated default additional repository owners when `?repo-owners=` is omitted              |
| `WHITELIST`           | No       | Case-insensitive comma-separated allowed GitHub usernames (unlisted requests return 403 no-store) |

\* At least one token among `GITHUB_TOKEN1`, `PAT_1`, `GITHUB_TOKEN2`, or
`PAT_2` is required for authenticated GitHub GraphQL requests.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

This project is licensed under the [MIT License](./LICENSE).
