# GitHub Profile Trophy

Add dynamically generated GitHub Stat Trophies to your README, running on
Cloudflare Workers.

[![stargazers](https://img.shields.io/github/stars/ryo-ma/github-profile-trophy)](https://github.com/ryo-ma/github-profile-trophy/stargazers)
[![forks](https://img.shields.io/github/forks/ryo-ma/github-profile-trophy)](https://github.com/ryo-ma/github-profile-trophy/network/members)
[![issues](https://img.shields.io/github/issues/ryo-ma/github-profile-trophy)](https://github.com/ryo-ma/github-profile-trophy/issues)
[![license](https://img.shields.io/github/license/ryo-ma/github-profile-trophy)](https://github.com/ryo-ma/github-profile-trophy/blob/master/LICENSE)

## Quick Start

Add the following code to your README. When pasting the code into your profile's
README, change the `?username=` value to your GitHub username.

```markdown
[![trophy](https://github-profile-trophy.hakula.xyz/?username=ryo-ma)](https://github.com/hakulab/github-profile-trophy)
```

![GitHub Profile Trophy preview](https://github-profile-trophy.hakula.xyz/?username=ryo-ma&column=8&rank=SSS,SS,S,AAA,AA,A,B,C)

### Use theme

Add the optional `theme` parameter.

```markdown
[![trophy](https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=onedark)](https://github.com/hakulab/github-profile-trophy)
```

![OneDark theme preview](https://user-images.githubusercontent.com/6661165/92327052-d99b9e00-f091-11ea-9a24-c7ec86982370.png)

**[More detail](#apply-theme)**

## About Rank

Ranks are `SSS` `SS` `S` `AAA` `AA` `A` `B` `C` `UNKNOWN` `SECRET`.

| Rank       | Description                                                                                |
| ---------- | ------------------------------------------------------------------------------------------ |
| SSS, SS, S | You are at a hard to reach rank. You can brag.                                             |
| AAA, AA, A | You will reach this rank if you do your best. Let's aim here first.                        |
| B, C       | You are currently making good progress. Let's aim a bit higher.                            |
| UNKNOWN    | You have not taken action yet. Let's act first.                                            |
| SECRET     | This rank is very rare. The trophy will not be displayed until certain conditions are met. |

**NOTE: The `UNKNOWN` rank is denoted by `?`**

### Secret Rank

The acquisition condition is secret, but you can see this.

![Secret rank trophy](https://github.com/user-attachments/assets/40461f38-a317-431c-93d2-a56c2e803cf3)

There are only a few secret trophies. Therefore, if you come up with interesting
conditions, contributions are welcome.

## About Display details

![Trophy display details](https://user-images.githubusercontent.com/6661165/91642962-6333e600-ea6a-11ea-83af-e371e996bfa6.png)

1. Title name of aggregation target.
2. Current rank.
3. Title according to rank.
4. Target aggregation result.
5. Rank progress bar.

## Optional Request Parameters

- [title](#filter-by-titles)
- [rank](#filter-by-ranks)
- [column](#specify-the-maximum-row--column-size)
- [row](#specify-the-maximum-row--column-size)
- [theme](#apply-theme)
- [margin-w](#margin-width)
- [margin-h](#margin-height)
- [no-bg](#transparent-background)
- [no-frame](#hide-frames)

### Filter by titles

You can filter the display by specifying the titles of trophies.

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&title=Followers
```

![Filter by Followers title](https://user-images.githubusercontent.com/6661165/92317141-80ebe700-f038-11ea-8501-4015bfbb2cf4.png)

If you want to specify multiple titles:

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&title=Stars,Followers
```

![Filter by Stars and Followers titles](https://github.com/user-attachments/assets/3b8a1c8b-afcd-49dc-ab18-a439d5c36a83)

You can also exclude the trophies you don't want to display:

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&title=-Stars,-Followers
```

### Filter by ranks

You can filter the display by specifying the ranks.\
`Available values: SECRET SSS SS S AAA AA A B C`

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&rank=S
```

![Filter by S rank](https://user-images.githubusercontent.com/6661165/91642657-1cdd8780-ea68-11ea-994b-4568a55cd22a.png)

If you want to specify multiple ranks:

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&rank=S,AAA
```

![Filter by S and AAA ranks](https://github.com/user-attachments/assets/0c2ffca8-4b03-4d46-b1d7-4e1eb6702f68)

You can also exclude ranks:

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&rank=-C,-B
```

**NOTE: Since `UNKNOWN` is denoted by `?`, in order to include or exclude it you
will have to use `rank=?` and `rank=-?` respectively.**

### Specify the maximum row & column size

You can specify the maximum row and column size.\
Trophies will be hidden if they exceed the range of both row and column.

`Available value: number type`\
`Default: column=6 row=3`

Restrict only row:

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&row=2
```

Restrict only column:

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&column=2
```

Restrict row & column:

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&row=2&column=3
```

![Row and column restriction](https://user-images.githubusercontent.com/6661165/91659474-c07f7400-eb0a-11ea-84f2-eb6b42547829.png)

Adaptive column:

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&column=-1
```

You can set `column` to `-1` to adapt the width to the number of trophies; the
parameter `row` will be ignored.

### Apply theme

Available themes:

| theme                       |
| --------------------------- |
| [flat](#flat)               |
| [onedark](#onedark)         |
| [gruvbox](#gruvbox)         |
| [dracula](#dracula)         |
| [monokai](#monokai)         |
| [chalk](#chalk)             |
| [nord](#nord)               |
| [alduin](#alduin)           |
| [darkhub](#darkhub)         |
| [juicyfresh](#juicyfresh)   |
| [buddhism](#buddhism)       |
| [oldie](#oldie)             |
| [radical](#radical)         |
| [onestar](#onestar)         |
| [discord](#discord)         |
| [algolia](#algolia)         |
| [gitdimmed](#gitdimmed)     |
| [tokyonight](#tokyonight)   |
| [matrix](#matrix)           |
| [apprentice](#apprentice)   |
| [dark_dimmed](#dark_dimmed) |
| [dark_lover](#dark_lover)   |
| [kimbie_dark](#kimbie_dark) |
| [aura](#aura)               |

#### flat

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=flat
```

![flat theme](https://user-images.githubusercontent.com/6661165/92325601-039b9300-f087-11ea-983a-fce8133549ee.png)

#### onedark

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=onedark
```

![onedark theme](https://user-images.githubusercontent.com/6661165/92327052-d99b9e00-f091-11ea-9a24-c7ec86982370.png)

#### gruvbox

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=gruvbox
```

![gruvbox theme](https://user-images.githubusercontent.com/6661165/92315152-e9c56600-f01c-11ea-9536-1bfbb158cfcb.png)

#### dracula

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=dracula
```

![dracula theme](https://user-images.githubusercontent.com/6661165/92490273-c91f2b00-f22b-11ea-9481-b5daae4d7bc3.png)

#### monokai

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=monokai
```

![monokai theme](https://user-images.githubusercontent.com/6661165/93725426-2c289e80-fbea-11ea-96a4-f6490ccf2126.png)

#### chalk

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=chalk
```

![chalk theme](https://user-images.githubusercontent.com/6661165/94294003-1de7d300-ff9a-11ea-91d1-60417a4d919b.png)

#### nord

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=nord
```

![nord theme](https://user-images.githubusercontent.com/6661165/94346857-7ab2be80-006a-11eb-9082-36d377ae2531.png)

#### alduin

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=alduin
```

![alduin theme](https://user-images.githubusercontent.com/6661165/99085932-2a88bf00-260c-11eb-9b26-d2f125773831.png)

#### darkhub

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=darkhub
```

![darkhub theme](https://user-images.githubusercontent.com/6661165/102801126-249ab080-43f8-11eb-91c8-f56f94c35777.png)

#### juicyfresh

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=juicyfresh
```

![juicyfresh theme](https://user-images.githubusercontent.com/6661165/104810094-edbc8c80-5835-11eb-8c20-a76192a00728.png)

#### buddhism

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=buddhism
```

![buddhism theme](https://user-images.githubusercontent.com/6661165/113709167-2412f500-971d-11eb-9ee5-0ab292cf8b4c.png)

#### oldie

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=oldie
```

![oldie theme](https://user-images.githubusercontent.com/6661165/113709581-a0a5d380-971d-11eb-8583-770dc4091ebf.png)

#### radical

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=radical
```

![radical theme](https://user-images.githubusercontent.com/6661165/116633521-adbc8800-a994-11eb-97c4-e45a32721491.png)

#### onestar

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=onestar
```

![onestar theme](https://user-images.githubusercontent.com/6661165/122048400-2af46d00-ce1c-11eb-94e0-c2c6ddaf6819.png)

#### discord

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=discord
```

![discord theme](https://user-images.githubusercontent.com/6661165/122048628-7dce2480-ce1c-11eb-9792-1e600b384c4d.png)

#### algolia

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=algolia
```

![algolia theme](https://user-images.githubusercontent.com/6661165/131685203-92a31101-2d93-4d18-b24a-d81a8bb012c5.png)

#### gitdimmed

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=gitdimmed
```

![gitdimmed theme](https://user-images.githubusercontent.com/6661165/131685406-799a864f-2691-4840-bb71-1db9c087a507.png)

#### tokyonight

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=tokyonight
```

![tokyonight theme](https://user-images.githubusercontent.com/6661165/135482087-27764d6f-53b4-4c2a-8473-32431d12660c.png)

#### matrix

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=matrix
```

![matrix theme](https://user-images.githubusercontent.com/31789752/141647414-15cfe279-af12-4746-a886-f494c25c096d.png)

#### apprentice

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=apprentice
```

![apprentice theme](https://user-images.githubusercontent.com/31789752/144701036-285cdd4b-d687-4ddc-95c2-7ccae9e25a1f.png)

#### dark_dimmed

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=dark_dimmed
```

![dark_dimmed theme](https://user-images.githubusercontent.com/31789752/147340893-655b9fa5-138f-4f29-91ec-2a17c93822d1.png)

#### dark_lover

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=dark_lover
```

![dark_lover theme](https://user-images.githubusercontent.com/31789752/152659041-de5b23cb-1be8-4e6b-b07b-726127ab8c3a.png)

#### kimbie_dark

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=kimbie_dark
```

![kimbie_dark theme](https://user-images.githubusercontent.com/8161064/288417332-408705a4-ae9c-47fe-af1a-9fb08555f526.png)

#### aura

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&theme=aura
```

![aura theme](https://github.com/user-attachments/assets/18a2266c-9a88-4882-940d-162c0c4d36e0)

### Margin Width

You can put a margin in the width between trophies.\
`Available value: number type`\
`Default: margin-w=0`

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&margin-w=15
```

![Margin width example](https://user-images.githubusercontent.com/6661165/93668661-e0ca9f00-fac8-11ea-9bec-325454f49fb4.png)

### Margin Height

You can put a margin in the height between trophies.\
`Available value: number type`\
`Default: margin-h=0`

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&margin-h=15
```

![Margin height example](https://github.com/user-attachments/assets/233dee5b-4491-46cc-884a-39d0aa928752)

### Example layout

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&column=3&margin-w=15&margin-h=15
```

![Example layout](https://user-images.githubusercontent.com/6661165/93668677-ff309a80-fac8-11ea-8ae3-3e3e8adbef39.png)

### Transparent background

You can turn the background transparent.\
`Available value: boolean type (true or false)`\
`Default: no-bg=false`

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&no-bg=true
```

![Transparent background example](https://github.com/user-attachments/assets/32d3b63b-7845-42cb-b71c-31abaa673bcb)

### Hide frames

You can hide the frames around the trophies.\
`Available value: boolean type (true or false)`\
`Default: no-frame=false`

```text
https://github-profile-trophy.hakula.xyz/?username=ryo-ma&no-frame=true
```

![Hide frames example](https://github.com/user-attachments/assets/54de15a3-d907-4a50-8117-170aae74d1cd)

## Self-hosting on Cloudflare Workers

By self-hosting you avoid shared rate limits and control your own caching.

1. Fork this repository and update the `routes` setting in `wrangler.toml` for
   your own domain (or remove it to use the default `*.workers.dev` URL).

2. Generate a GitHub personal access token with `read:user` and `public_repo`
   scopes (use `repo` if you want private contributions counted).

3. Configure the token secret with Wrangler (and optionally a second token for
   rotation):

   ```sh
   pnpm wrangler secret put GITHUB_TOKEN1
   pnpm wrangler secret put GITHUB_TOKEN2
   ```

4. Deploy the Worker:

   ```sh
   pnpm deploy
   ```

5. Use your deployed endpoint:

   ```text
   https://<your-worker-domain>/?username=USERNAME
   ```

## Contribution Guide

Check [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.

## License

This product is licensed under the [MIT License](./LICENSE).
