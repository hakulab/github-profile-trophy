import { Logger } from '../Helpers/Logger';
import { EServiceKindError, ServiceError, type GithubError } from '../Types/index';
import { CONSTANTS } from '../utils';

export type FetchLike = typeof fetch;

export interface RequestGithubOptions {
  apiUrl?: string;
  token?: string;
  fetchImpl?: FetchLike;
}

interface GraphQLPayload<T> {
  data?: T;
  errors?: GithubError[];
  message?: string;
  documentation_url?: string;
}

export async function requestGithubGraphQL<T = unknown>(
  query: string,
  variables: Record<string, string | null | undefined>,
  options: RequestGithubOptions = {},
): Promise<T> {
  const apiUrl = options.apiUrl ?? CONSTANTS.DEFAULT_GITHUB_API;
  const token = options.token ?? '';
  const fetchImpl = options.fetchImpl ?? fetch;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'github-profile-trophy',
  };
  if (token) {
    headers.Authorization = `bearer ${token}`;
  }

  const response = await fetchImpl(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  let responseData: GraphQLPayload<T>;
  try {
    responseData = await response.json<GraphQLPayload<T>>();
  } catch {
    throw new ServiceError(
      `GitHub API returned non-JSON response (HTTP ${response.status})`,
      EServiceKindError.UPSTREAM,
    );
  }

  if (responseData.errors?.length) {
    Logger.error(`GitHub GraphQL errors: ${JSON.stringify(responseData.errors, null, 2)}`);

    throw new ServiceError(
      responseData.errors.map((error) => error.message).join('; '),
      getGraphQLErrorKind(responseData.errors),
    );
  }

  if (responseData.data !== undefined && responseData.data !== null) {
    return responseData.data;
  }

  throw handleError(responseData, response.status);
}

export async function requestGithubData<T = unknown>(
  query: string,
  variables: Record<string, string | null | undefined>,
  options: RequestGithubOptions = {},
): Promise<T> {
  const data = await requestGithubGraphQL<{ user?: T | null }>(query, variables, options);
  if (data.user) {
    return data.user;
  }

  throw new ServiceError('User not found', EServiceKindError.NOT_FOUND);
}

function getGraphQLErrorKind(errors: GithubError[]): EServiceKindError {
  const errorTypes = errors.map((error) => error.type);

  if (errorTypes.some((type) => type.includes(EServiceKindError.RATE_LIMIT))) {
    return EServiceKindError.RATE_LIMIT;
  }

  if (errorTypes.every((type) => type === (EServiceKindError.NOT_FOUND as string))) {
    return EServiceKindError.NOT_FOUND;
  }

  return EServiceKindError.UPSTREAM;
}

function handleError(
  responseData: {
    data?: unknown;
    message?: string;
    documentation_url?: string;
  },
  status: number,
): ServiceError {
  const isRateLimitExceeded =
    status === 429 || Boolean(responseData.message?.toLowerCase().includes('rate limit'));

  if (isRateLimitExceeded) {
    return new ServiceError('Rate limit exceeded', EServiceKindError.RATE_LIMIT);
  }

  return new ServiceError(
    responseData.message ?? `GitHub API error (HTTP ${status})`,
    EServiceKindError.UPSTREAM,
  );
}
