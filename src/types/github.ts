export type Label = { name: string; color: string };
export type Issue = { title: string; url: string; createdAt: string; labels: Label[] };
export type PullRequest = { title: string; url: string; createdAt: string; labels: Label[] };

export type Repository = { owner: string; repository: string };
export type User = { login: string; id: string; avatarUrl: string; url: string; name: string | null };
export type UserWithStats = User & {
  commits: number;
  issues: { count: number; data: Issue[] };
  prs: { count: number; data: PullRequest[] };
};
