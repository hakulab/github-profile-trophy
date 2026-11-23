import { describe, expect, it, vi } from 'vitest';

import { EServiceKindError, ServiceError } from '../../Types/index';
import { requestGithubData } from '../request';

describe('requestGithubData', () => {
  it('rejects partial GraphQL responses with UPSTREAM ServiceError', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: { user: { login: 'test' } },
          errors: [{ message: 'Field access failed', type: 'FORBIDDEN' }],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      await expect(
        requestGithubData('query { viewer { login } }', {}, { fetchImpl: fetchMock }),
      ).rejects.toSatisfy((error: unknown) => {
        expect(error).toBeInstanceOf(ServiceError);
        const serviceError = error as ServiceError;
        expect(serviceError.message).toContain('Field access failed');
        expect(serviceError.cause).toBe(EServiceKindError.UPSTREAM);
        expect(serviceError.code).toBe(502);
        return true;
      });
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it('uses custom apiUrl and Authorization header when token is provided', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { user: { login: 'octocat' } } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await requestGithubData<{ login: string }>(
      'query ($username: String!) { user(login: $username) { login } }',
      { username: 'octocat' },
      {
        apiUrl: 'https://example.test/graphql',
        token: 'secret-token',
        fetchImpl: fetchMock,
      },
    );

    expect(result).toEqual({ login: 'octocat' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://example.test/graphql');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({
      'Authorization': 'bearer secret-token',
      'Content-Type': 'application/json',
    });
  });
});
