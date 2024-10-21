import { z } from 'zod';

export const LabelSchema = z.object({
  name: z.string(),
  color: z.string(),
});

export type LabelSchemaType = z.infer<typeof LabelSchema>;

export const IssueSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  createdAt: z.string(),
  updatedAt: z.string(),
  labels: z.array(LabelSchema),
});

export type IssueSchemaType = z.infer<typeof IssueSchema>;

export const PullRequestSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  createdAt: z.string(),
  updatedAt: z.string(),
  labels: z.array(LabelSchema),
});

export type PullRequestSchemaType = z.infer<typeof PullRequestSchema>;

export const UserSchema = z.object({
  login: z.string(),
  id: z.string(),
  avatarUrl: z.string().url(),
  url: z.string().url(),
  name: z.string().nullable(),
});

export type UserSchemaType = z.infer<typeof UserSchema>;

export const UserWithStatsSchema = UserSchema.merge(
  z.object({
    commits: z.number(),
    issues: z.object({ count: z.number(), data: z.array(IssueSchema) }),
    prs: z.object({ count: z.number(), data: z.array(PullRequestSchema) }),
    mrs: z.object({ count: z.number(), data: z.array(PullRequestSchema) }),
    reviewedMrs: z.object({ count: z.number(), data: z.array(PullRequestSchema) }),
  }),
);

export type UserWithStatsSchemaType = z.infer<typeof UserWithStatsSchema>;
