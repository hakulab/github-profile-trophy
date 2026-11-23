import { Card } from './card';
import { type Env } from './env';
import { Error400, Error403 } from './error_page';
import { setLoggingEnabled } from './Helpers/Logger';
import { ErrorPage } from './pages/Error';
import { type GithubRepository } from './Repository/GithubRepository';
import { GithubApiService } from './Services/GithubApiService';
import { COLORS, type Theme } from './theme';
import { ServiceError } from './Types/index';
import { CONSTANTS, escapeHtml, normalizeRepoOwners, parseParams } from './utils';

export interface AppDependencies {
  client?: GithubRepository;
  cache?: Cache;
  waitUntil?: (promise: Promise<unknown>) => void;
}

const cacheControlHeader = [
  'public',
  `max-age=${CONSTANTS.CACHE_MAX_AGE}`,
  `s-maxage=${CONSTANTS.CDN_CACHE_MAX_AGE}`,
  `stale-while-revalidate=${CONSTANTS.STALE_WHILE_REVALIDATE}`,
].join(', ');

const errorCacheControlHeader = 'no-store';

export function parseWhitelist(env: Pick<Env, 'WHITELIST'> = {}): Set<string> | null {
  if (!env.WHITELIST) {
    return null;
  }

  const allowed = env.WHITELIST.split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);

  return allowed.length > 0 ? new Set(allowed) : null;
}

export function resolveRepoOwners(
  searchParams: URLSearchParams,
  env: Pick<Env, 'DEFAULT_REPO_OWNERS'> = {},
  primaryUsername?: string,
): string[] {
  const hasExplicitParam = searchParams.has('repo-owners') || searchParams.has('repo_owners');
  const rawValues = hasExplicitParam
    ? [...searchParams.getAll('repo-owners'), ...searchParams.getAll('repo_owners')]
    : env.DEFAULT_REPO_OWNERS
      ? [env.DEFAULT_REPO_OWNERS]
      : [];

  return normalizeRepoOwners(rawValues, primaryUsername);
}

export function buildCacheKey(
  request: Request,
  env: Pick<Env, 'DEFAULT_REPO_OWNERS'> = {},
): Request {
  const url = new URL(request.url);
  const username = url.searchParams.get('username') ?? undefined;
  const effectiveOwners = resolveRepoOwners(url.searchParams, env, username);

  const entries: [string, string][] = [];
  for (const [key, value] of url.searchParams.entries()) {
    if (key === 'repo-owners' || key === 'repo_owners') {
      continue;
    }
    if (key === 'username') {
      entries.push([key, value.trim().toLowerCase()]);
      continue;
    }
    entries.push([key, value]);
  }

  if (effectiveOwners.length > 0) {
    entries.push(['repo-owners', effectiveOwners.join(',')]);
  }

  const sortedEntries = entries.toSorted(([aKey, aVal], [bKey, bVal]) => {
    const keyCompare = aKey.localeCompare(bKey);
    return keyCompare !== 0 ? keyCompare : aVal.localeCompare(bVal);
  });

  const normalized = new URL(url.origin + url.pathname);
  for (const [key, value] of sortedEntries) {
    normalized.searchParams.append(key, value);
  }

  return new Request(normalized.toString(), { method: 'GET' });
}

export async function app(
  req: Request,
  env: Env = {},
  deps: AppDependencies = {},
): Promise<Response> {
  setLoggingEnabled(env.ENV_TYPE !== 'test');

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        Allow: 'GET, HEAD',
      },
    });
  }

  const isHead = req.method === 'HEAD';
  const url = new URL(req.url);
  if (url.pathname === '/favicon.ico') {
    return new Response(null, { status: 404 });
  }

  const params = parseParams(req);
  const username = params.get('username');
  const row = params.getNumberValue('row', CONSTANTS.DEFAULT_MAX_ROW);
  const column = params.getNumberValue('column', CONSTANTS.DEFAULT_MAX_COLUMN);
  const themeParam = params.getStringValue('theme', 'default');

  if (username === null) {
    const base = escapeHtml(`${url.origin}${url.pathname}`);
    const error = new Error400(
      `<section>
      <div>
        <h2>"username" is a required query parameter</h2>
        <p>The URL should look like
        <div>
          <p id="base-show">${base}?username=USERNAME</p>
          <button>Copy Base Url</button>
          <span id="temporary-span"></span>
        </div>where
        <code>USERNAME</code> is <em>your GitHub username.</em>
      </div>
      <div>
        <h2>You can use this form: </h2>
        <p>Enter your username and click "Get Trophies"</p>
        <form action="${base}" method="get">
          <label for="username">GitHub Username</label>
          <input type="text" name="username" id="username" placeholder="Ex. gabriel-logan" required>
          <label for="theme">Theme (Optional)</label>
          <input type="text" name="theme" id="theme" placeholder="Ex. onedark" value="default">
          <text>
            See all the available themes
            <a href="https://github.com/hakulab/github-profile-trophy#themes" target="_blank">here</a>
          </text>
          <br>
          <button type="submit">Get Trophies</button>
        </form>
      </div>
      <script>
        const button = document.querySelector("button");
        const input = document.querySelector("input");
        const temporarySpan = document.querySelector("#temporary-span");

        button.addEventListener("click", () => {
          navigator.clipboard.writeText(document.querySelector("#base-show").textContent);
          temporarySpan.textContent = "Copied!";
          setTimeout(() => {
            temporarySpan.textContent = "";
          }, 1500);
        });
      </script>
    </section>`,
    );
    return new Response(isHead ? null : error.render(), {
      status: error.status,
      headers: new Headers({
        'Content-Type': 'text/html',
        'Cache-Control': errorCacheControlHeader,
      }),
    });
  }

  const whitelist = parseWhitelist(env);
  if (whitelist && !whitelist.has(username.trim().toLowerCase())) {
    const error = new Error403('This username is not whitelisted on this instance.');
    return new Response(isHead ? null : error.render(), {
      status: error.status,
      headers: new Headers({
        'Content-Type': 'text/html',
        'Cache-Control': errorCacheControlHeader,
      }),
    });
  }

  const cache = deps.cache;
  const cacheKey = cache ? buildCacheKey(req, env) : null;
  if (cache && cacheKey) {
    const cached = await cache.match(cacheKey);
    if (cached) {
      return isHead
        ? new Response(null, {
            status: cached.status,
            headers: cached.headers,
          })
        : cached;
    }
  }

  let theme: Theme = COLORS.default;
  if (Object.hasOwn(COLORS, themeParam)) {
    theme = COLORS[themeParam];
  }

  const marginWidth = params.getNumberValue('margin-w', CONSTANTS.DEFAULT_MARGIN_W);
  const paddingHeight = params.getNumberValue('margin-h', CONSTANTS.DEFAULT_MARGIN_H);
  const noBackground = params.getBooleanValue('no-bg', CONSTANTS.DEFAULT_NO_BACKGROUND);
  const noFrame = params.getBooleanValue('no-frame', CONSTANTS.DEFAULT_NO_FRAME);
  const titles = params
    .getAll('title')
    .flatMap((r) => r.split(','))
    .map((r) => r.trim());
  const ranks = params
    .getAll('rank')
    .flatMap((r) => r.split(','))
    .map((r) => r.trim());

  const repoOwners = resolveRepoOwners(params, env, username);

  const client = deps.client ?? new GithubApiService(env);
  const userInfo = await client.requestUserInfo(username, repoOwners);

  if (userInfo instanceof ServiceError) {
    return new Response(isHead ? null : ErrorPage({ error: userInfo }).render(), {
      status: userInfo.code,
      headers: new Headers({
        'Content-Type': 'text/html',
        'Cache-Control': errorCacheControlHeader,
      }),
    });
  }

  const svg = new Card(
    titles,
    ranks,
    column,
    row,
    CONSTANTS.DEFAULT_PANEL_SIZE,
    marginWidth,
    paddingHeight,
    noBackground,
    noFrame,
  ).render(userInfo, theme);

  const response = new Response(svg, {
    status: 200,
    headers: new Headers({
      'Content-Type': 'image/svg+xml',
      'Cache-Control': cacheControlHeader,
    }),
  });

  if (cache && cacheKey) {
    const putPromise = cache.put(cacheKey, response.clone());
    if (deps.waitUntil) {
      deps.waitUntil(putPromise);
    } else {
      await putPromise;
    }
  }

  if (isHead) {
    return new Response(null, {
      status: response.status,
      headers: response.headers,
    });
  }

  return response;
}
