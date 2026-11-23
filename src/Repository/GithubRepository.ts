import { type ServiceError } from '../Types/index';
import {
  type GitHubUserActivity,
  type GitHubUserAll,
  type GitHubUserIssue,
  type GitHubUserPullRequest,
  type GitHubUserRepository,
  type UserInfo,
} from '../user_info';

export abstract class GithubRepository {
  abstract requestUserInfo(username: string): Promise<UserInfo | ServiceError>;
  abstract requestUserAll(username: string): Promise<GitHubUserAll | ServiceError>;
  abstract requestUserActivity(username: string): Promise<GitHubUserActivity | ServiceError>;
  abstract requestUserIssue(username: string): Promise<GitHubUserIssue | ServiceError>;
  abstract requestUserPullRequest(username: string): Promise<GitHubUserPullRequest | ServiceError>;
  abstract requestUserRepository(username: string): Promise<GitHubUserRepository | ServiceError>;
}

export class GithubRepositoryService {
  constructor(public repository: GithubRepository) {}
}
