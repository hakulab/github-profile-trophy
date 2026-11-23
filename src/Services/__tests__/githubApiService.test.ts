import { describe, expect, it, vi } from 'vitest';

import notFoundUserMock from '../__mocks__/notFoundUserMock.json';
import rateLimitMock from '../__mocks__/rateLimitMock.json';
import successGithubResponse from '../__mocks__/successGithubResponse.json';
import { setLoggingEnabled } from '../../Helpers/Logger';
import { EServiceKindError, ServiceError } from '../../Types/index';
import { type GitHubUserRepository } from '../../user_info';
import { GithubApiService } from '../GithubApiService';

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
});
