export class CustomURLSearchParams extends URLSearchParams {
  getStringValue(key: string, defaultValue: string): string {
    if (super.has(key)) {
      const param = super.get(key);
      if (param !== null) {
        return param;
      }
    }
    return defaultValue;
  }
  getNumberValue(key: string, defaultValue: number): number {
    if (super.has(key)) {
      const param = super.get(key);
      if (param !== null) {
        const parsedValue = parseInt(param);
        if (isNaN(parsedValue)) {
          return defaultValue;
        }
        return parsedValue;
      }
    }
    return defaultValue;
  }
  getBooleanValue(key: string, defaultValue: boolean): boolean {
    if (super.has(key)) {
      const param = super.get(key);
      return param !== null && param === 'true';
    }
    return defaultValue;
  }
}

export function parseParams(req: Request): CustomURLSearchParams {
  return new CustomURLSearchParams(new URL(req.url).searchParams);
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function abridgeScore(score: number): string {
  if (Math.abs(score) < 1) {
    return '0pt';
  }
  if (Math.abs(score) > 999) {
    return (Math.sign(score) * (Math.abs(score) / 1000)).toFixed(1) + 'kpt';
  }
  return (Math.sign(score) * Math.abs(score)).toString() + 'pt';
}

export const CONSTANTS = {
  CACHE_MAX_AGE: 18800,
  CDN_CACHE_MAX_AGE: 28800, // 8 hours for CDN edge cache
  STALE_WHILE_REVALIDATE: 86400, // 24 hours - serve stale while revalidating
  DEFAULT_PANEL_SIZE: 110,
  DEFAULT_MAX_COLUMN: 8,
  DEFAULT_MAX_ROW: 3,
  DEFAULT_MARGIN_W: 0,
  DEFAULT_MARGIN_H: 0,
  DEFAULT_NO_BACKGROUND: false,
  DEFAULT_NO_FRAME: false,
  DEFAULT_GITHUB_API: 'https://api.github.com/graphql',
  DEFAULT_GITHUB_RETRY_DELAY: 500,
  MAX_ADDITIONAL_REPO_OWNERS: 10,
  MAX_OWNER_REPO_PAGES: 10,
};

/**
 * Normalize additional repository owner logins: split, trim, lowercase,
 * exclude `primaryUsername`, deduplicate, cap at `maxOwners` in caller order,
 * and sort lexicographically.
 */
export function normalizeRepoOwners(
  rawValues: string[],
  primaryUsername?: string,
  maxOwners: number = CONSTANTS.MAX_ADDITIONAL_REPO_OWNERS,
): string[] {
  const primaryLower = primaryUsername?.trim().toLowerCase();
  const owners = new Set<string>();

  for (const raw of rawValues) {
    for (const part of raw.split(',')) {
      const normalized = part.trim().toLowerCase();
      if (!normalized || normalized === primaryLower) {
        continue;
      }
      owners.add(normalized);
    }
  }

  return [...owners].slice(0, maxOwners).toSorted((a, b) => a.localeCompare(b));
}

export enum RANK {
  SECRET = 'SECRET',
  SSS = 'SSS',
  SS = 'SS',
  S = 'S',
  AAA = 'AAA',
  AA = 'AA',
  A = 'A',
  B = 'B',
  C = 'C',
  UNKNOWN = '?',
}

export const RANK_ORDER = Object.values(RANK);
