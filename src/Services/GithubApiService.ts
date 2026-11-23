import { type Env } from '../env';
import { Logger } from '../Helpers/Logger';
import { Retry } from '../Helpers/Retry';
import { GithubRepository } from '../Repository/GithubRepository';
import {
  queryRepositoryOwnerRepositories,
  queryUserActivity,
  queryUserAll,
  queryUserIssue,
  queryUserPullRequest,
  queryUserRepository,
} from '../Schemas/index';
import { EServiceKindError, ServiceError } from '../Types/index';
import {
  UserInfo,
  type GitHubRepositoryOwner,
  type GitHubUserActivity,
  type GitHubUserAll,
  type GitHubUserIssue,
  type GitHubUserPullRequest,
  type GitHubUserRepository,
  type RepositoryOwnerSummaryNode,
} from '../user_info';
import { CONSTANTS, normalizeRepoOwners } from '../utils';
import {
  requestGithubData,
  requestGithubGraphQL,
  type FetchLike,
  type RequestGithubOptions,
} from './request';

export interface GithubApiServiceOptions {
  tokens?: (string | undefined)[];
  apiUrl?: string;
  retryDelay?: number;
  fetchImpl?: FetchLike;
}

function normalizeTokens(tokens: (string | undefined)[]): string[] {
  const configured = tokens.filter(
    (token): token is string => typeof token === 'string' && token.length > 0,
  );
  const unique = [...new Set(configured)];
  return unique.length > 0 ? unique : [''];
}

export function resolveTokens(
  env: Pick<Env, 'GITHUB_TOKEN1' | 'GITHUB_TOKEN2' | 'PAT_1' | 'PAT_2'>,
): string[] {
  return normalizeTokens([env.GITHUB_TOKEN1, env.PAT_1, env.GITHUB_TOKEN2, env.PAT_2]);
}

export class GithubApiService extends GithubRepository {
  private readonly tokens: string[];
  private readonly apiUrl: string;
  private readonly retryDelay: number;
  private readonly fetchImpl?: FetchLike;

  constructor(env: Env = {}, options: GithubApiServiceOptions = {}) {
    super();
    this.tokens = options.tokens ? normalizeTokens(options.tokens) : resolveTokens(env);
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

  async requestOwnerRepositories(
    login: string,
  ): Promise<{ totalCount: number; nodes: RepositoryOwnerSummaryNode[] } | ServiceError> {
    const nodes: RepositoryOwnerSummaryNode[] = [];
    let after: string | null = null;
    let totalCount = 0;

    for (let pageIndex = 0; pageIndex < CONSTANTS.MAX_OWNER_REPO_PAGES; pageIndex += 1) {
      const page: { repositoryOwner?: GitHubRepositoryOwner | null } | ServiceError =
        await this.executeGraphQLQuery<{
          repositoryOwner?: GitHubRepositoryOwner | null;
        }>(queryRepositoryOwnerRepositories, { login, after });
      if (page instanceof ServiceError) {
        return page;
      }

      const owner: GitHubRepositoryOwner | null | undefined = page.repositoryOwner;
      if (!owner) {
        return new ServiceError(
          `Repository owner "${login}" not found`,
          EServiceKindError.NOT_FOUND,
        );
      }

      totalCount = owner.repositories.totalCount;
      nodes.push(...owner.repositories.nodes);

      const hasNextPage: boolean = owner.repositories.pageInfo.hasNextPage;
      const nextCursor: string | null = owner.repositories.pageInfo.endCursor;
      if (!hasNextPage || !nextCursor || nextCursor === after) {
        return { totalCount, nodes };
      }
      after = nextCursor;
    }

    return { totalCount, nodes };
  }

  async requestUserInfo(
    username: string,
    repoOwners: string[] = [],
  ): Promise<UserInfo | ServiceError> {
    try {
      const normalizedAdditionalOwners = normalizeRepoOwners(repoOwners, username);
      const userAllPromise = this.requestUserAll(username);

      if (normalizedAdditionalOwners.length === 0) {
        const result = await userAllPromise;
        if (result instanceof ServiceError) {
          return result;
        }
        return UserInfo.fromCombined(result);
      }

      const ownersToAggregate = [username.trim().toLowerCase(), ...normalizedAdditionalOwners];
      const [userAll, ...ownerSummaries] = await Promise.all([
        userAllPromise,
        ...ownersToAggregate.map((owner) => this.requestOwnerRepositories(owner)),
      ]);

      if (userAll instanceof ServiceError) {
        return userAll;
      }

      const seenRepos = new Map<string, number>();
      const languages = new Set<string>();
      for (const repo of userAll.repositories.nodes) {
        for (const lang of repo.languages.nodes) {
          if (lang.name) {
            languages.add(lang.name);
          }
        }
      }

      let totalRepositories = 0;

      for (const summary of ownerSummaries) {
        if (summary instanceof ServiceError) {
          return summary;
        }

        let duplicatesInOwner = 0;
        for (const repo of summary.nodes) {
          const key = repo.nameWithOwner.toLowerCase();
          if (seenRepos.has(key)) {
            duplicatesInOwner += 1;
            continue;
          }
          seenRepos.set(key, repo.stargazerCount);
          const primaryLanguageName = repo.primaryLanguage?.name;
          if (primaryLanguageName) {
            languages.add(primaryLanguageName);
          }
        }

        totalRepositories += Math.max(0, summary.totalCount - duplicatesInOwner);
      }

      let totalStargazers = 0;
      for (const stars of seenRepos.values()) {
        totalStargazers += stars;
      }

      return UserInfo.fromCombined(userAll, {
        totalRepositories,
        totalStargazers,
        languageCount: languages.size,
      });
    } catch (error) {
      Logger.error(`Error fetching user info for username: ${username}`);
      return this.toServiceError(error);
    }
  }

  async executeGraphQLQuery<T = unknown>(
    query: string,
    variables: Record<string, string | null | undefined>,
  ): Promise<T | ServiceError> {
    return await this.executeWithRetry(requestGithubGraphQL<T>, query, variables);
  }

  async executeQuery<T = unknown>(
    query: string,
    variables: Record<string, string | null | undefined>,
  ): Promise<T | ServiceError> {
    return await this.executeWithRetry(requestGithubData<T>, query, variables);
  }

  private async executeWithRetry<T>(
    requester: (
      query: string,
      variables: Record<string, string | null | undefined>,
      options: RequestGithubOptions,
    ) => Promise<T>,
    query: string,
    variables: Record<string, string | null | undefined>,
  ): Promise<T | ServiceError> {
    try {
      const retry = new Retry(this.tokens.length, this.retryDelay);
      return await retry.fetch<T>(async ({ attempt }) => {
        return await requester(query, variables, {
          apiUrl: this.apiUrl,
          token: this.tokens[attempt],
          fetchImpl: this.fetchImpl,
        });
      });
    } catch (error) {
      return this.toServiceError(error);
    }
  }

  private toServiceError(error: unknown): ServiceError {
    if (error instanceof ServiceError) {
      Logger.error(error.message);
      return error;
    }
    if (error instanceof Error && error.cause instanceof ServiceError) {
      Logger.error(error.cause.message);
      return error.cause;
    }
    if (error instanceof Error && error.cause) {
      Logger.error(JSON.stringify(error.cause, null, 2));
    } else {
      Logger.error(error);
    }
    return new ServiceError('GitHub API request failed', EServiceKindError.UPSTREAM);
  }
}
