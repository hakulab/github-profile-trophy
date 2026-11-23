import { describe, expect, it, vi } from 'vitest';

import notFoundUserMock from '../__mocks__/notFoundUserMock.json';
import rateLimitMock from '../__mocks__/rateLimitMock.json';
import successGithubResponse from '../__mocks__/successGithubResponse.json';
import { setLoggingEnabled } from '../../Helpers/Logger';
import { EServiceKindError, ServiceError } from '../../Types/index';
import { UserInfo, type GitHubUserAll, type GitHubUserRepository } from '../../user_info';
import { GithubApiService, resolveTokens } from '../GithubApiService';

setLoggingEnabled(false);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GithubApiService', () => {
  it('returns user repository data on the first attempt', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(successGithubResponse.data));
    const provider = new GithubApiService(
      { GITHUB_TOKEN1: 'token-1', GITHUB_TOKEN2: 'token-2' },
      { retryDelay: 0, fetchImpl: fetchMock },
    );

    const data = (await provider.requestUserRepository('test')) as GitHubUserRepository;

    expect(data.repositories.totalCount).toBe(128);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rotates from GITHUB_TOKEN1 to GITHUB_TOKEN2 on failure', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(rateLimitMock.rate_limit.data))
      .mockResolvedValueOnce(jsonResponse(successGithubResponse.data));

    const provider = new GithubApiService(
      { GITHUB_TOKEN1: 'token-1', GITHUB_TOKEN2: 'token-2' },
      { retryDelay: 0, fetchImpl: fetchMock },
    );

    const data = (await provider.requestUserRepository('test')) as GitHubUserRepository;

    expect(data.repositories.totalCount).toBe(128);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    const secondHeaders = fetchMock.mock.calls[1]?.[1]?.headers as Record<string, string>;
    expect(firstHeaders.Authorization).toBe('bearer token-1');
    expect(secondHeaders.Authorization).toBe('bearer token-2');
  });

  it('returns 404 ServiceError when user is not found via requestUserInfo', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(notFoundUserMock.data))
      .mockResolvedValueOnce(jsonResponse(notFoundUserMock.data));

    const provider = new GithubApiService(
      { GITHUB_TOKEN1: 'token-1', GITHUB_TOKEN2: 'token-2' },
      { retryDelay: 0, fetchImpl: fetchMock },
    );

    const error = await provider.requestUserInfo('test');

    expect(error).toBeInstanceOf(ServiceError);
    expect((error as ServiceError).code).toBe(404);
  });

  it('returns 404 ServiceError when user is not found via requestUserRepository', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(notFoundUserMock.data))
      .mockResolvedValueOnce(jsonResponse(notFoundUserMock.data));

    const provider = new GithubApiService(
      { GITHUB_TOKEN1: 'token-1', GITHUB_TOKEN2: 'token-2' },
      { retryDelay: 0, fetchImpl: fetchMock },
    );

    const error = await provider.requestUserRepository('test');

    expect(error).toBeInstanceOf(ServiceError);
    expect((error as ServiceError).code).toBe(404);
  });

  it('returns 419 ServiceError on GraphQL rate limit', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(rateLimitMock.rate_limit.data))
      .mockResolvedValueOnce(jsonResponse(rateLimitMock.rate_limit.data));

    const provider = new GithubApiService(
      { GITHUB_TOKEN1: 'token-1', GITHUB_TOKEN2: 'token-2' },
      { retryDelay: 0, fetchImpl: fetchMock },
    );

    const error = await provider.requestUserRepository('test');

    expect(error).toBeInstanceOf(ServiceError);
    expect((error as ServiceError).code).toBe(419);
    expect((error as ServiceError).cause).toBe(EServiceKindError.RATE_LIMIT);
  });

  it('returns 419 ServiceError on secondary rate limit exceeded', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(rateLimitMock.rate_limit.data))
      .mockResolvedValueOnce(jsonResponse(rateLimitMock.exceeded.data, 403));

    const provider = new GithubApiService(
      { GITHUB_TOKEN1: 'token-1', GITHUB_TOKEN2: 'token-2' },
      { retryDelay: 0, fetchImpl: fetchMock },
    );

    const error = await provider.requestUserRepository('test');

    expect(error).toBeInstanceOf(ServiceError);
    expect((error as ServiceError).code).toBe(419);
  });

  it('preserves legacy single-owner behavior when repoOwners is omitted or matches primary', async () => {
    const primaryUser: GitHubUserAll = {
      createdAt: '2018-01-01T00:00:00Z',
      contributionsCollection: {
        totalCommitContributions: 300,
        restrictedContributionsCount: 20,
        totalPullRequestReviewContributions: 15,
      },
      organizations: { totalCount: 2 },
      followers: { totalCount: 80 },
      openIssues: { totalCount: 4 },
      closedIssues: { totalCount: 16 },
      pullRequests: { totalCount: 45 },
      repositories: {
        totalCount: 12,
        nodes: [
          {
            nameWithOwner: 'alice/repo-a',
            languages: { nodes: [{ name: 'TypeScript' }, { name: 'Nix' }] },
            stargazerCount: 50,
            createdAt: '2019-05-01T00:00:00Z',
          },
          {
            nameWithOwner: 'alice/repo-b',
            languages: { nodes: [{ name: 'Rust' }] },
            stargazerCount: 10,
            createdAt: '2020-05-01T00:00:00Z',
          },
        ],
      },
    };

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ data: { user: primaryUser } }))
      .mockResolvedValueOnce(jsonResponse({ data: { user: primaryUser } }));

    const provider = new GithubApiService(
      { GITHUB_TOKEN1: 'token-1' },
      { retryDelay: 0, fetchImpl: fetchMock },
    );

    const single = await provider.requestUserInfo('alice');
    const selfOnly = await provider.requestUserInfo('alice', ['ALICE']);

    expect(single).toBeInstanceOf(UserInfo);
    expect(selfOnly).toBeInstanceOf(UserInfo);
    expect((single as UserInfo).totalRepositories).toBe(12);
    expect((single as UserInfo).totalStargazers).toBe(60);
    expect((selfOnly as UserInfo).totalRepositories).toBe(12);
    expect((selfOnly as UserInfo).totalStargazers).toBe(60);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('merges repositories across primary user and additional owners with pagination and deduplication', async () => {
    const primaryUser: GitHubUserAll = {
      createdAt: '2018-01-01T00:00:00Z',
      contributionsCollection: {
        totalCommitContributions: 300,
        restrictedContributionsCount: 20,
        totalPullRequestReviewContributions: 15,
      },
      organizations: { totalCount: 2 },
      followers: { totalCount: 80 },
      openIssues: { totalCount: 4 },
      closedIssues: { totalCount: 16 },
      pullRequests: { totalCount: 45 },
      repositories: {
        totalCount: 3,
        nodes: [
          {
            nameWithOwner: 'alice/top-repo',
            languages: { nodes: [{ name: 'TypeScript' }] },
            stargazerCount: 40,
            createdAt: '2019-01-01T00:00:00Z',
          },
        ],
      },
    };

    const fetchMock = vi.fn<typeof fetch>(async (_input, init) => {
      const body = JSON.parse(init?.body as string) as {
        query: string;
        variables: { username?: string; login?: string; after?: string | null };
      };

      if (body.query.includes('user(login:')) {
        return jsonResponse({ data: { user: primaryUser } });
      }

      if (body.variables.login === 'alice' && !body.variables.after) {
        return jsonResponse({
          data: {
            repositoryOwner: {
              repositories: {
                totalCount: 3,
                pageInfo: { hasNextPage: true, endCursor: 'cursor-1' },
                nodes: [
                  {
                    nameWithOwner: 'alice/top-repo',
                    primaryLanguage: { name: 'TypeScript' },
                    stargazerCount: 40,
                  },
                  {
                    nameWithOwner: 'alice/second-repo',
                    primaryLanguage: { name: 'Rust' },
                    stargazerCount: 15,
                  },
                ],
              },
            },
          },
        });
      }

      if (body.variables.login === 'alice' && body.variables.after === 'cursor-1') {
        return jsonResponse({
          data: {
            repositoryOwner: {
              repositories: {
                totalCount: 3,
                pageInfo: { hasNextPage: false, endCursor: null },
                nodes: [
                  {
                    nameWithOwner: 'alice/third-repo',
                    primaryLanguage: null,
                    stargazerCount: 5,
                  },
                ],
              },
            },
          },
        });
      }

      if (body.variables.login === 'acme-org' && !body.variables.after) {
        return jsonResponse({
          data: {
            repositoryOwner: {
              repositories: {
                totalCount: 5,
                pageInfo: { hasNextPage: true, endCursor: 'zero-star-tail' },
                nodes: [
                  {
                    nameWithOwner: 'acme-org/project-one',
                    primaryLanguage: { name: 'Go' },
                    stargazerCount: 25,
                  },
                  {
                    nameWithOwner: 'ALICE/top-repo',
                    primaryLanguage: { name: 'Haskell' },
                    stargazerCount: 40,
                  },
                  {
                    nameWithOwner: 'acme-org/zero-star',
                    primaryLanguage: { name: 'Nix' },
                    stargazerCount: 0,
                  },
                ],
              },
            },
          },
        });
      }

      if (body.variables.login === 'acme-org' && body.variables.after === 'zero-star-tail') {
        return jsonResponse({
          data: {
            repositoryOwner: {
              repositories: {
                totalCount: 5,
                pageInfo: { hasNextPage: false, endCursor: null },
                nodes: [
                  {
                    nameWithOwner: 'acme-org/zero-star-two',
                    primaryLanguage: { name: 'Python' },
                    stargazerCount: 0,
                  },
                  {
                    nameWithOwner: 'acme-org/docs-only',
                    primaryLanguage: null,
                    stargazerCount: 0,
                  },
                ],
              },
            },
          },
        });
      }

      if (body.variables.login === 'acme-archive') {
        return jsonResponse({
          data: {
            repositoryOwner: {
              repositories: {
                totalCount: 2,
                pageInfo: { hasNextPage: false, endCursor: null },
                nodes: [
                  {
                    nameWithOwner: 'acme-archive/archive-one',
                    primaryLanguage: { name: 'Rust' },
                    stargazerCount: 12,
                  },
                  {
                    nameWithOwner: 'acme-archive/archive-two',
                    primaryLanguage: { name: 'Shell' },
                    stargazerCount: 3,
                  },
                ],
              },
            },
          },
        });
      }

      throw new Error(`Unexpected GraphQL request: ${JSON.stringify(body.variables)}`);
    });

    const provider = new GithubApiService(
      { GITHUB_TOKEN1: 'token-1' },
      { retryDelay: 0, fetchImpl: fetchMock },
    );

    const result = await provider.requestUserInfo('alice', [
      'acme-archive',
      'Acme-Org',
      'alice',
      'acme-org',
    ]);

    expect(result).toBeInstanceOf(UserInfo);
    const info = result as UserInfo;
    expect(info.totalRepositories).toBe(9);
    expect(info.totalStargazers).toBe(100);
    expect(info.totalCommits).toBe(320);
    expect(info.totalFollowers).toBe(80);
    expect(info.totalIssues).toBe(20);
    expect(info.totalPullRequests).toBe(45);
    expect(info.totalReviews).toBe(15);
    expect(info.totalOrganizations).toBe(2);
    expect(info.languageCount).toBe(6);
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it('surfaces 404 ServiceError when an additional repository owner does not exist', async () => {
    const primaryUser: GitHubUserAll = {
      createdAt: '2018-01-01T00:00:00Z',
      contributionsCollection: {
        totalCommitContributions: 10,
        restrictedContributionsCount: 0,
        totalPullRequestReviewContributions: 0,
      },
      organizations: { totalCount: 0 },
      followers: { totalCount: 1 },
      openIssues: { totalCount: 0 },
      closedIssues: { totalCount: 0 },
      pullRequests: { totalCount: 0 },
      repositories: { totalCount: 1, nodes: [] },
    };

    const fetchMock = vi.fn<typeof fetch>(async (_input, init) => {
      const body = JSON.parse(init?.body as string) as {
        query: string;
        variables: { login?: string };
      };

      if (body.query.includes('user(login:')) {
        return jsonResponse({ data: { user: primaryUser } });
      }

      if (body.variables.login === 'alice') {
        return jsonResponse({
          data: {
            repositoryOwner: {
              repositories: {
                totalCount: 1,
                pageInfo: { hasNextPage: false, endCursor: null },
                nodes: [{ nameWithOwner: 'alice/only', stargazerCount: 1 }],
              },
            },
          },
        });
      }

      return jsonResponse({ data: { repositoryOwner: null } });
    });

    const provider = new GithubApiService(
      { GITHUB_TOKEN1: 'token-1' },
      { retryDelay: 0, fetchImpl: fetchMock },
    );

    const error = await provider.requestUserInfo('alice', ['missing-org']);

    expect(error).toBeInstanceOf(ServiceError);
    expect((error as ServiceError).code).toBe(404);
    expect((error as ServiceError).message).toContain('missing-org');
  });

  it('surfaces 419 ServiceError when an additional owner hits rate limit instead of returning partial totals', async () => {
    const primaryUser: GitHubUserAll = {
      createdAt: '2018-01-01T00:00:00Z',
      contributionsCollection: {
        totalCommitContributions: 10,
        restrictedContributionsCount: 0,
        totalPullRequestReviewContributions: 0,
      },
      organizations: { totalCount: 0 },
      followers: { totalCount: 1 },
      openIssues: { totalCount: 0 },
      closedIssues: { totalCount: 0 },
      pullRequests: { totalCount: 0 },
      repositories: { totalCount: 1, nodes: [] },
    };

    const fetchMock = vi.fn<typeof fetch>(async (_input, init) => {
      const body = JSON.parse(init?.body as string) as {
        query: string;
        variables: { login?: string };
      };

      if (body.query.includes('user(login:')) {
        return jsonResponse({ data: { user: primaryUser } });
      }

      if (body.variables.login === 'alice') {
        return jsonResponse({
          data: {
            repositoryOwner: {
              repositories: {
                totalCount: 1,
                pageInfo: { hasNextPage: false, endCursor: null },
                nodes: [{ nameWithOwner: 'alice/only', stargazerCount: 1 }],
              },
            },
          },
        });
      }

      return jsonResponse(rateLimitMock.rate_limit.data);
    });

    const provider = new GithubApiService(
      { GITHUB_TOKEN1: 'token-1' },
      { retryDelay: 0, fetchImpl: fetchMock },
    );

    const error = await provider.requestUserInfo('alice', ['acme-org']);

    expect(error).toBeInstanceOf(ServiceError);
    expect((error as ServiceError).code).toBe(419);
    expect((error as ServiceError).cause).toBe(EServiceKindError.RATE_LIMIT);
  });

  it('stops paginating when the cursor does not advance', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({
        data: {
          repositoryOwner: {
            repositories: {
              totalCount: 2,
              pageInfo: { hasNextPage: true, endCursor: 'stuck-cursor' },
              nodes: [
                {
                  nameWithOwner: 'acme-org/repo-one',
                  primaryLanguage: { name: 'TypeScript' },
                  stargazerCount: 5,
                },
              ],
            },
          },
        },
      }),
    );

    const provider = new GithubApiService(
      { GITHUB_TOKEN1: 'token-1' },
      { retryDelay: 0, fetchImpl: fetchMock },
    );

    const result = await provider.requestOwnerRepositories('acme-org');

    expect(result).not.toBeInstanceOf(ServiceError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('caps owner repository pagination at MAX_OWNER_REPO_PAGES', async () => {
    let callCount = 0;
    const fetchMock = vi.fn<typeof fetch>(async () => {
      callCount += 1;
      return jsonResponse({
        data: {
          repositoryOwner: {
            repositories: {
              totalCount: 2000,
              pageInfo: { hasNextPage: true, endCursor: `cursor-${callCount}` },
              nodes: [
                {
                  nameWithOwner: `acme-org/repo-${callCount}`,
                  primaryLanguage: { name: 'TypeScript' },
                  stargazerCount: 1,
                },
              ],
            },
          },
        },
      });
    });

    const provider = new GithubApiService(
      { GITHUB_TOKEN1: 'token-1' },
      { retryDelay: 0, fetchImpl: fetchMock },
    );

    const result = await provider.requestOwnerRepositories('acme-org');

    expect(result).not.toBeInstanceOf(ServiceError);
    expect(fetchMock).toHaveBeenCalledTimes(10);
  });

  it('maps unexpected fetch failures to 502 UPSTREAM instead of 404 NOT_FOUND', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('network down'));

    const provider = new GithubApiService(
      { GITHUB_TOKEN1: 'token-1' },
      { retryDelay: 0, fetchImpl: fetchMock },
    );

    const error = await provider.requestUserInfo('alice');

    expect(error).toBeInstanceOf(ServiceError);
    expect((error as ServiceError).code).toBe(502);
    expect((error as ServiceError).cause).toBe(EServiceKindError.UPSTREAM);
  });

  it('accepts PAT_1 and PAT_2 aliases alongside GITHUB_TOKEN1 and GITHUB_TOKEN2', () => {
    expect(resolveTokens({ PAT_1: 'pat-1', PAT_2: 'pat-2' })).toEqual(['pat-1', 'pat-2']);
    expect(
      resolveTokens({
        GITHUB_TOKEN1: 'token-1',
        PAT_1: 'pat-1',
        GITHUB_TOKEN2: 'token-2',
        PAT_2: 'pat-2',
      }),
    ).toEqual(['token-1', 'pat-1', 'token-2', 'pat-2']);
    expect(
      resolveTokens({
        GITHUB_TOKEN1: 'token-1',
        PAT_1: 'token-1',
        PAT_2: 'pat-2',
      }),
    ).toEqual(['token-1', 'pat-2']);
    expect(resolveTokens({ GITHUB_TOKEN1: '', PAT_1: '' })).toEqual(['']);
    expect(resolveTokens({})).toEqual(['']);
  });
});
