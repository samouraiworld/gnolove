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

export const GHUserSchema = z.object({
  login: z.string(),
  id: z.number(),
  node_id: z.string(),
  avatar_url: z.string().url(),
  gravatar_id: z.string(),
  url: z.string().url(),
  html_url: z.string().url(),
  followers_url: z.string().url(),
  following_url: z.string().url(),
  gists_url: z.string().url(),
  starred_url: z.string().url(),
  subscriptions_url: z.string().url(),
  organizations_url: z.string().url(),
  repos_url: z.string().url(),
  events_url: z.string().url(),
  received_events_url: z.string().url(),
  type: z.string(),
  user_view_type: z.string(),
  site_admin: z.boolean(),
});

export type GHUserSchemaType = z.infer<typeof GHUserSchema>;

export const GHLabelSchema = z.object({
  id: z.number(),
  node_id: z.string(),
  url: z.string().url(),
  name: z.string(),
  color: z.string(),
  default: z.boolean(),
  description: z.string(),
});

export const MilestoneIssueSchema = z.object({
  url: z.string().url(),
  repository_url: z.string().url(),
  labels_url: z.string().url(),
  comments_url: z.string().url(),
  events_url: z.string().url(),
  html_url: z.string().url(),
  id: z.number(),
  node_id: z.string(),
  number: z.number(),
  title: z.string(),
  user: GHUserSchema,
  labels: z.array(GHLabelSchema),
  state: z.literal('open').or(z.literal('closed')),
  locked: z.boolean(),
  assignee: GHUserSchema.nullable(),
  assignees: z.array(GHUserSchema),

  // milestone: MilestoneSchema,

  comments: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  author_association: z.string(),
  draft: z.boolean().nullish(),
  body: z.string().nullable(),
  timeline_url: z.string().url(),

  // TODO: Type the following fields
  // closed_by: null,
  // closed_at: null,
  // active_lock_reason: null,
  // performed_via_github_app: null,
  // state_reason: null,
});

export type MilestoneIssueSchemaType = z.infer<typeof MilestoneIssueSchema>;

export const MilestoneSchema = z.object({
  url: z.string().url(),
  html_url: z.string().url(),
  labels_url: z.string().url(),
  id: z.number(),
  node_id: z.string(),
  number: z.number(),
  title: z.string(),
  description: z.string(),
  creator: GHUserSchema,
  open_issues: z.number(),
  closed_issues: z.number(),
  state: z.string(),
  created_at: z.string(),
  updated_at: z.string(),

  issues: z.array(MilestoneIssueSchema),

  // TODO: Type due_on and closed_at
  // due_on: null,
  // closed_at: null
});

export type MilestoneSchemaType = z.infer<typeof MilestoneSchema>;
