import { getMilestone } from '@/util/milestones';

export type Label = { name: string; color: string };
export type Issue = { id: string; title: string; url: string; createdAt: string; updatedAt: string; labels: Label[] };
export type PullRequest = {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  labels: Label[];
};

export type Repository = { owner: string; repository: string };
export type User = { login: string; id: string; avatarUrl: string; url: string; name: string | null };
export type UserWithStats = User & {
  commits: number;
  issues: { count: number; data: Issue[] };
  prs: { count: number; data: PullRequest[] };
  mrs: { count: number; data: PullRequest[] };
  reviewedMrs: { count: number; data: PullRequest[] };
};
export type UserWithStatsAndScore = UserWithStats & { score: number };

export type Milestone = NoUndefined<Awaited<ReturnType<typeof getMilestone>>>;
