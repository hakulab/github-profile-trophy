import { describe, expect, it, vi } from 'vitest';

import { app, buildCacheKey, parseWhitelist, resolveRepoOwners } from '../app';
import { GithubRepository } from '../Repository/GithubRepository';
import { EServiceKindError, ServiceError } from '../Types/index';
import {
  UserInfo,
  type GitHubUserActivity,
  type GitHubUserAll,
  type GitHubUserIssue,
  type GitHubUserPullRequest,
  type GitHubUserRepository,
} from '../user_info';

function createMockUserInfo(): UserInfo {
  return UserInfo.fromCombined({
    createdAt: '2020-01-01T00:00:00Z',
    contributionsCollection: {
      totalCommitContributions: 250,
      restrictedContributionsCount: 50,
      totalPullRequestReviewContributions: 12,
    },
    organizations: { totalCount: 2 },
    followers: { totalCount: 42 },
    openIssues: { totalCount: 5 },
    closedIssues: { totalCount: 15 },
    pullRequests: { totalCount: 30 },
    repositories: {
      totalCount: 10,
      nodes: [
        {
          languages: { nodes: [{ name: 'TypeScript' }] },
          stargazerCount: 60,
          createdAt: '2020-06-01T00:00:00Z',
        },
      ],
    },
  });
}

function createMockCache(): {
  cache: Cache;
  store: Map<string, Response>;
} {
  const store = new Map<string, Response>();
  const cache = {
    match: vi.fn(async (req: RequestInfo | URL) => {
      const key = typeof req === 'string' ? req : req instanceof URL ? req.toString() : req.url;
      return store.get(key)?.clone();
    }),
    put: vi.fn(async (req: RequestInfo | URL, res: Response) => {
      const key = typeof req === 'string' ? req : req instanceof URL ? req.toString() : req.url;
      store.set(key, res.clone());
    }),
    delete: vi.fn(async () => false),
  } as unknown as Cache;

  return { cache, store };
}

class StubGithubRepository extends GithubRepository {
  public readonly requestUserInfoSpy =
    vi.fn<(username: string, repoOwners?: string[]) => Promise<UserInfo | ServiceError>>();

  constructor(result: UserInfo | ServiceError) {
    super();
    this.requestUserInfoSpy.mockResolvedValue(result);
  }

  requestUserInfo(username: string, repoOwners?: string[]): Promise<UserInfo | ServiceError> {
    return this.requestUserInfoSpy(username, repoOwners);
  }

  requestUserAll(): Promise<GitHubUserAll | ServiceError> {
    throw new Error('Not implemented in stub');
  }

  requestUserActivity(): Promise<GitHubUserActivity | ServiceError> {
    throw new Error('Not implemented in stub');
  }

  requestUserIssue(): Promise<GitHubUserIssue | ServiceError> {
    throw new Error('Not implemented in stub');
  }

  requestUserPullRequest(): Promise<GitHubUserPullRequest | ServiceError> {
    throw new Error('Not implemented in stub');
  }

  requestUserRepository(): Promise<GitHubUserRepository | ServiceError> {
    throw new Error('Not implemented in stub');
  }
}

describe('app', () => {
  it('returns 400 HTML when username is missing', async () => {
    const res = await app(new Request('https://trophy.example.com/'), { ENV_TYPE: 'test' });

    expect(res.status).toBe(400);
    expect(res.headers.get('Content-Type')).toBe('text/html');
    const html = await res.text();
    expect(html).toContain('"username" is a required query parameter');
  });

  it('returns 405 for non-GET/HEAD requests', async () => {
    const res = await app(
      new Request('https://trophy.example.com/?username=octocat', { method: 'POST' }),
      { ENV_TYPE: 'test' },
    );

    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('GET, HEAD');
  });

  it('returns 404 for /favicon.ico without calling GitHub', async () => {
    const client = new StubGithubRepository(createMockUserInfo());
    const res = await app(
      new Request('https://trophy.example.com/favicon.ico'),
      { ENV_TYPE: 'test' },
      { client },
    );

    expect(res.status).toBe(404);
    expect(client.requestUserInfoSpy).not.toHaveBeenCalled();
  });

  it('renders an SVG trophy card and caches it via Cache API', async () => {
    const client = new StubGithubRepository(createMockUserInfo());
    const { cache } = createMockCache();
    const waitUntilPromises: Promise<unknown>[] = [];

    const first = await app(
      new Request('https://trophy.example.com/?username=octocat&theme=dracula'),
      { ENV_TYPE: 'test' },
      {
        client,
        cache,
        waitUntil: (promise) => {
          waitUntilPromises.push(promise);
        },
      },
    );

    await Promise.all(waitUntilPromises);

    expect(first.status).toBe(200);
    expect(first.headers.get('Content-Type')).toBe('image/svg+xml');
    expect(first.headers.get('Cache-Control')).toContain('public');
    const svg = await first.text();
    expect(svg).toContain('<svg');
    expect(svg).toContain('Stars');
    expect(client.requestUserInfoSpy).toHaveBeenCalledTimes(1);

    const second = await app(
      new Request('https://trophy.example.com/?theme=dracula&username=octocat'),
      { ENV_TYPE: 'test' },
      { client, cache },
    );

    expect(second.status).toBe(200);
    expect(await second.text()).toBe(svg);
    expect(client.requestUserInfoSpy).toHaveBeenCalledTimes(1);
  });

  it('returns ServiceError HTTP status and does not cache errors', async () => {
    const client = new StubGithubRepository(
      new ServiceError('User not found', EServiceKindError.NOT_FOUND),
    );
    const { cache, store } = createMockCache();

    const res = await app(
      new Request('https://trophy.example.com/?username=missing'),
      { ENV_TYPE: 'test' },
      { client, cache },
    );

    expect(res.status).toBe(404);
    expect(res.headers.get('Content-Type')).toBe('text/html');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(store.size).toBe(0);
  });

  it('normalizes query parameter order in buildCacheKey', () => {
    const a = buildCacheKey(new Request('https://trophy.example.com/?theme=dark&username=alice'));
    const b = buildCacheKey(new Request('https://trophy.example.com/?username=alice&theme=dark'));
    expect(a.url).toBe(b.url);
  });

  it('normalizes repo-owners and repo_owners aliases in buildCacheKey', () => {
    const a = buildCacheKey(
      new Request('https://trophy.example.com/?username=alice&repo-owners=org-b,Org-A,alice'),
    );
    const b = buildCacheKey(
      new Request('https://trophy.example.com/?username=alice&repo_owners=%20org-a%20,%20org-b'),
    );
    const c = buildCacheKey(new Request('https://trophy.example.com/?username=alice'), {
      DEFAULT_REPO_OWNERS: 'org-b, org-a',
    });

    expect(a.url).toBe(b.url);
    expect(a.url).toBe(c.url);
    expect(new URL(a.url).searchParams.get('repo-owners')).toBe('org-a,org-b');
  });

  it('isolates cache keys across distinct owner sets and explicit empty opt-out', () => {
    const withDefault = buildCacheKey(new Request('https://trophy.example.com/?username=alice'), {
      DEFAULT_REPO_OWNERS: 'org-a,org-b',
    });
    const optedOut = buildCacheKey(
      new Request('https://trophy.example.com/?username=alice&repo-owners='),
      { DEFAULT_REPO_OWNERS: 'org-a,org-b' },
    );
    const differentOwner = buildCacheKey(
      new Request('https://trophy.example.com/?username=alice&repo-owners=org-a'),
      { DEFAULT_REPO_OWNERS: 'org-a,org-b' },
    );

    expect(withDefault.url).not.toBe(optedOut.url);
    expect(withDefault.url).not.toBe(differentOwner.url);
    expect(optedOut.url).not.toContain('repo-owners=');
  });

  it('passes normalized repo-owners and DEFAULT_REPO_OWNERS fallback to client', async () => {
    const client = new StubGithubRepository(createMockUserInfo());

    await app(
      new Request('https://trophy.example.com/?username=alice'),
      { ENV_TYPE: 'test', DEFAULT_REPO_OWNERS: 'org-b, Org-A, alice' },
      { client },
    );
    expect(client.requestUserInfoSpy).toHaveBeenLastCalledWith('alice', ['org-a', 'org-b']);

    await app(
      new Request('https://trophy.example.com/?username=alice&repo_owners=Beta-Org,alpha-org'),
      { ENV_TYPE: 'test', DEFAULT_REPO_OWNERS: 'org-a' },
      { client },
    );
    expect(client.requestUserInfoSpy).toHaveBeenLastCalledWith('alice', ['alpha-org', 'beta-org']);

    await app(
      new Request('https://trophy.example.com/?username=alice&repo-owners='),
      { ENV_TYPE: 'test', DEFAULT_REPO_OWNERS: 'org-a' },
      { client },
    );
    expect(client.requestUserInfoSpy).toHaveBeenLastCalledWith('alice', []);
  });

  it('caps additional repo-owners at MAX_ADDITIONAL_REPO_OWNERS', () => {
    const owners = Array.from({ length: 15 }, (_, i) => `org${String(i).padStart(2, '0')}`).join(
      ',',
    );
    const resolved = resolveRepoOwners(new URLSearchParams({ 'repo-owners': owners }), {}, 'alice');
    expect(resolved).toHaveLength(10);
    expect(resolved[0]).toBe('org00');
    expect(resolved[9]).toBe('org09');
  });

  it('enforces WHITELIST case-insensitively and rejects unlisted usernames with 403 no-store', async () => {
    const client = new StubGithubRepository(createMockUserInfo());
    const { cache, store } = createMockCache();

    const allowed = await app(
      new Request('https://trophy.example.com/?username=Alice'),
      { ENV_TYPE: 'test', WHITELIST: ' alice , bob ' },
      { client, cache },
    );
    expect(allowed.status).toBe(200);
    expect(client.requestUserInfoSpy).toHaveBeenCalledTimes(1);

    const rejected = await app(
      new Request('https://trophy.example.com/?username=charlie'),
      { ENV_TYPE: 'test', WHITELIST: 'alice,bob' },
      { client, cache },
    );
    expect(rejected.status).toBe(403);
    expect(rejected.headers.get('Content-Type')).toBe('text/html');
    expect(rejected.headers.get('Cache-Control')).toBe('no-store');
    expect(await rejected.text()).toContain('403 - Forbidden');
    expect(client.requestUserInfoSpy).toHaveBeenCalledTimes(1);
    expect(store.size).toBe(1);
  });

  it('allows any username when WHITELIST is unset or blank', async () => {
    const client = new StubGithubRepository(createMockUserInfo());

    expect(parseWhitelist({})).toBeNull();
    expect(parseWhitelist({ WHITELIST: ' , ' })).toBeNull();

    const res = await app(
      new Request('https://trophy.example.com/?username=bob'),
      { ENV_TYPE: 'test', WHITELIST: '   ' },
      { client },
    );
    expect(res.status).toBe(200);
    expect(client.requestUserInfoSpy).toHaveBeenCalledTimes(1);
  });
});
