import { Card } from './card';
import { type Env } from './env';
import { Error400 } from './error_page';
import { setLoggingEnabled } from './Helpers/Logger';
import { ErrorPage } from './pages/Error';
import { GithubRepositoryService, type GithubRepository } from './Repository/GithubRepository';
import { GithubApiService } from './Services/GithubApiService';
import { COLORS, type Theme } from './theme';
import { ServiceError } from './Types/index';
import { CONSTANTS, parseParams } from './utils';

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

export function buildCacheKey(request: Request): Request {
  const url = new URL(request.url);
  const sortedEntries = [...url.searchParams.entries()].toSorted(([aKey, aVal], [bKey, bVal]) => {
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
  if (env.ENV_TYPE === 'test') {
    setLoggingEnabled(false);
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        Allow: 'GET, HEAD',
      },
    });
  }

  const url = new URL(req.url);
  if (url.pathname === '/favicon.ico') {
    return new Response(null, { status: 404 });
  }

  const cache = deps.cache;
  const cacheKey = cache ? buildCacheKey(req) : null;
  if (cache && cacheKey) {
    const cached = await cache.match(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const params = parseParams(req);
  const username = params.get('username');
  const row = params.getNumberValue('row', CONSTANTS.DEFAULT_MAX_ROW);
  const column = params.getNumberValue('column', CONSTANTS.DEFAULT_MAX_COLUMN);
  const themeParam = params.getStringValue('theme', 'default');

  if (username === null) {
    const [base] = req.url.split('?');
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
          <input type="text" name="theme" id="theme" placeholder="Ex. onedark" value="light">
          <text>
            See all the available themes
            <a href="https://github.com/ryo-ma/github-profile-trophy?tab=readme-ov-file#apply-theme" target="_blank">here</a>
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
    return new Response(error.render(), {
      status: error.status,
      headers: new Headers({
        'Content-Type': 'text/html',
        'Cache-Control': cacheControlHeader,
      }),
    });
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

  const client = deps.client ?? new GithubRepositoryService(new GithubApiService(env)).repository;
  const userInfo = await client.requestUserInfo(username);

  if (userInfo instanceof ServiceError) {
    return new Response(ErrorPage({ error: userInfo }).render(), {
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

  return response;
}
