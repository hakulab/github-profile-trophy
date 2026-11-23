export interface GithubError {
  message: string;
  type: string;
}

export interface GithubErrorResponse {
  errors: GithubError[];
}

export interface GithubExceedError {
  documentation_url: string;
  message: string;
}

export interface QueryDefaultResponse<T = unknown> {
  data: {
    data: T;
    errors?: GithubError[];
    message?: string;
    documentation_url?: string;
  };
}
