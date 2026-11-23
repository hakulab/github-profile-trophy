import { describe, expect, it, vi } from 'vitest';

import { UserInfo } from '../user_info';

function createUserInfoForDate(createdAt: string): UserInfo {
  return UserInfo.fromCombined({
    createdAt,
    contributionsCollection: {
      restrictedContributionsCount: 0,
      totalCommitContributions: 0,
      totalPullRequestReviewContributions: 0,
    },
    organizations: { totalCount: 0 },
    followers: { totalCount: 0 },
    openIssues: { totalCount: 0 },
    closedIssues: { totalCount: 0 },
    pullRequests: { totalCount: 0 },
    repositories: {
      totalCount: 0,
      nodes: [],
    },
  });
}

describe('UserInfo', () => {
  it('calculates total stargazers', () => {
    const userInfo = new UserInfo(
      {
        createdAt: '2025-01-01T00:00:00Z',
        contributionsCollection: {
          restrictedContributionsCount: 0,
          totalCommitContributions: 0,
          totalPullRequestReviewContributions: 0,
        },
        organizations: { totalCount: 0 },
        followers: { totalCount: 0 },
      },
      {
        openIssues: { totalCount: 0 },
        closedIssues: { totalCount: 0 },
      },
      { pullRequests: { totalCount: 0 } },
      {
        repositories: {
          totalCount: 2,
          nodes: [
            {
              languages: { nodes: [] },
              stargazerCount: 3,
              createdAt: '2025-01-01T00:00:00Z',
            },
            {
              languages: { nodes: [] },
              stargazerCount: 5,
              createdAt: '2025-01-02T00:00:00Z',
            },
          ],
        },
      },
    );

    expect(userInfo.totalStargazers).toBe(8);
  });

  it('evaluates account-year trophies in UTC even when local year diverges', () => {
    const getFullYearSpy = vi.spyOn(Date.prototype, 'getFullYear').mockImplementation(function (
      this: Date,
    ) {
      return this.getUTCFullYear() - 1;
    });

    try {
      const og = createUserInfoForDate('2008-01-01T00:30:00Z');
      expect(og.ogAccount).toBe(1);
      expect(og.ancientAccount).toBe(1);
      expect(og.joined2020).toBe(0);

      const ancient = createUserInfoForDate('2010-01-01T00:30:00Z');
      expect(ancient.ogAccount).toBe(0);
      expect(ancient.ancientAccount).toBe(1);
      expect(ancient.joined2020).toBe(0);

      const joined2020 = createUserInfoForDate('2020-01-01T00:30:00Z');
      expect(joined2020.ogAccount).toBe(0);
      expect(joined2020.ancientAccount).toBe(0);
      expect(joined2020.joined2020).toBe(1);

      const post2020 = createUserInfoForDate('2021-01-01T00:30:00Z');
      expect(post2020.ogAccount).toBe(0);
      expect(post2020.ancientAccount).toBe(0);
      expect(post2020.joined2020).toBe(0);
    } finally {
      getFullYearSpy.mockRestore();
    }
  });
});
