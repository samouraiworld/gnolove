export type User = { login: string; id: string; avatarUrl: string; url: string; name: string | null };
export type UserWithStats = User & { commits: number; issues: number; prs: number };
