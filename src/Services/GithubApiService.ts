import { type Env } from '../env';
import { Logger } from '../Helpers/Logger';
import { Retry } from '../Helpers/Retry';
import { GithubRepository } from '../Repository/GithubRepository';
import {
  queryUserActivity,
  queryUserAll,
  queryUserIssue,
  queryUserPullRequest,
  queryUserRepository,
} from '../Schemas/index';
import { EServiceKindError, ServiceError } from '../Types/index';
import {
  UserInfo,
  type GitHubUserActivity,
  type GitHubUserAll,
  type GitHubUserIssue,
  type GitHubUserPullRequest,
  type GitHubUserRepository,
} from '../user_info';
import { CONSTANTS } from '../utils';
import { requestGithubData, type FetchLike } from './request';

export interface GithubApiServiceOptions {
  tokens?: (string | undefined)[];
  apiUrl?: string;
  retryDelay?: number;
  fetchImpl?: FetchLike;
}

export function resolveTokens(env: Pick<Env, 'GITHUB_TOKEN1' | 'GITHUB_TOKEN2'>): string[] {
  const configured = [env.GITHUB_TOKEN1, env.GITHUB_TOKEN2].filter(
    (token): token is string => typeof token === 'string' && token.length > 0,
  );
  return configured.length > 0 ? configured : [''];
}

export class GithubApiService extends GithubRepository {
  private readonly tokens: string[];
  private readonly apiUrl: string;
  private readonly retryDelay: number;
  private readonly fetchImpl?: FetchLike;

  constructor(env: Env = {}, options: GithubApiServiceOptions = {}) {
    super();
    const rawTokens = options.tokens ?? [env.GITHUB_TOKEN1, env.GITHUB_TOKEN2];
    const filtered = rawTokens.filter(
      (token): token is string => typeof token === 'string' && token.length > 0,
    );
    this.tokens = filtered.length > 0 ? filtered : [''];
    this.apiUrl = options.apiUrl ?? env.GITHUB_API ?? CONSTANTS.DEFAULT_GITHUB_API;
    this.retryDelay = options.retryDelay ?? CONSTANTS.DEFAULT_GITHUB_RETRY_DELAY;
    this.fetchImpl = options.fetchImpl;
  }

  async requestUserAll(username: string): Promise<GitHubUserAll | ServiceError> {
    return await this.executeQuery<GitHubUserAll>(queryUserAll, {
      username,
    });
  }

  async requestUserRepository(username: string): Promise<GitHubUserRepository | ServiceError> {
    return await this.executeQuery<GitHubUserRepository>(queryUserRepository, {
      username,
    });
  }

  async requestUserActivity(username: string): Promise<GitHubUserActivity | ServiceError> {
    return await this.executeQuery<GitHubUserActivity>(queryUserActivity, {
      username,
    });
  }

  async requestUserIssue(username: string): Promise<GitHubUserIssue | ServiceError> {
    return await this.executeQuery<GitHubUserIssue>(queryUserIssue, {
      username,
    });
  }

  async requestUserPullRequest(username: string): Promise<GitHubUserPullRequest | ServiceError> {
    return await this.executeQuery<GitHubUserPullRequest>(queryUserPullRequest, { username });
  }

  async requestUserInfo(username: string): Promise<UserInfo | ServiceError> {
    try {
      const result = await this.requestUserAll(username);
      if (result instanceof ServiceError) {
        return result;
      }
      return UserInfo.fromCombined(result);
    } catch {
      Logger.error(`Error fetching user info for username: ${username}`);
      return new ServiceError('Not found', EServiceKindError.NOT_FOUND);
    }
  }

  async executeQuery<T = unknown>(
    query: string,
    variables: Record<string, string>,
  ): Promise<T | ServiceError> {
    try {
      const retry = new Retry(this.tokens.length, this.retryDelay);
      return await retry.fetch<T>(async ({ attempt }) => {
        return await requestGithubData<T>(query, variables, {
          apiUrl: this.apiUrl,
          token: this.tokens[attempt],
          fetchImpl: this.fetchImpl,
        });
      });
    } catch (error) {
      if (error instanceof Error && error.cause instanceof ServiceError) {
        Logger.error(error.cause.message);
        return error.cause;
      }
      if (error instanceof Error && error.cause) {
        Logger.error(JSON.stringify(error.cause, null, 2));
      } else {
        Logger.error(error);
      }
      return new ServiceError('not found', EServiceKindError.NOT_FOUND);
    }
  }
}
