import { z } from 'zod';

export const LabelSchema = z.object({
  id: z.coerce.string(),
  name: z.string(),
  color: z.string(),
});

export type TLabel = z.infer<typeof LabelSchema>;

const preprocessUser = (data: unknown) => {
  if (!data || typeof data !== 'object') return data;
  const _data = data as any;
  return {
    ..._data,
    name: _data.name ?? _data.Name,
    login: _data.login ?? _data.Login,
    id: _data.id ?? _data.ID,
    avatarUrl: _data.avatarUrl ?? _data.AvatarURL ?? _data.AvatarUrl ?? _data.avatarURL,
    url: _data.url ?? _data.URL,
  };
};

export const UserBaseSchema = z.object({
  login: z.string(),
  id: z.coerce.string(),
  avatarUrl: z.string().url(),
  url: z.string().url(),
  name: z.string(),
});

export const UserSchema = z.preprocess(preprocessUser, UserBaseSchema);

export type TUser = z.infer<typeof UserSchema>;

const preprocessIssue = (data: unknown) => {
  if (!data || typeof data !== 'object') return data;
  const _data = data as any;

  const author = preprocessUser(_data.author ?? _data.Author);

  return {
    ..._data,
    createdAt: _data.createdAt ?? _data.CreatedAt,
    updatedAt: _data.updatedAt ?? _data.UpdatedAt,
    id: _data.id ?? _data.ID,
    number: _data.number ?? _data.Number,
    state: _data.state ?? _data.State,
    title: _data.title ?? _data.Title,
    url: _data.url ?? _data.URL,
    authorID: _data.authorID ?? _data.AuthorID,
    author: author?.id === '' ? undefined : author,
    labels: _data.labels ?? _data.Labels,
    milestoneID: _data.milestoneID ?? _data.MilestoneID,
  };
};

export const IssueBaseSchema = z.object({
  createdAt: z.string(),
  updatedAt: z.string(),
  id: z.coerce.string(),
  number: z.number(),
  state: z.string(),
  title: z.string(),
  authorID: z.string().nullish(),
  url: z.string().url(),
  author: UserSchema.nullish(),
  labels: z.array(LabelSchema).default([]),
  assignees: z.preprocess(
    (obj: unknown) => (Array.isArray(obj) ? obj.filter((el) => 'user' in el && el.user !== null) : []),
    z.array(z.object({ id: z.coerce.string(), user: UserSchema })).default([]),
  ),
});

export const IssueSchema = z.preprocess(preprocessIssue, IssueBaseSchema);

export type TIssue = z.infer<typeof IssueSchema>;

const preprocessPullRequest = (data: unknown) => {
  if (!data || typeof data !== 'object') return data;
  const _data = data as any;
  return {
    ..._data,
    createdAt: _data.createdAt ?? _data.CreatedAt,
    updatedAt: _data.updatedAt ?? _data.UpdatedAt,
    id: _data.id ?? _data.ID,
    number: _data.number ?? _data.Number,
    state: _data.state ?? _data.State,
    title: _data.title ?? _data.Title,
    url: _data.url ?? _data.URL,
    authorID: _data.authorID ?? _data.AuthorID,
  };
};

export const ReviewSchema: z.ZodType = z.lazy(() =>
  z.object({
    id: z.coerce.string(),
    authorID: z.string(),
    pullRequestID: z.string(),
    createdAt: z.string(),
    pullRequest: z.lazy(() => PullRequestSchema).nullable(),
    author: UserSchema.nullish(),
  })
);

export type TReview = z.infer<typeof ReviewSchema>;

export const PullRequestBaseSchema = z.object({
  createdAt: z.string(),
  updatedAt: z.string(),
  id: z.coerce.string(),
  number: z.number(),
  state: z.string(),
  title: z.string(),
  url: z.string().url(),
  authorID: z.string().optional(),
  author: UserSchema.nullish(),
  reviews: z.array(ReviewSchema).nullish(),
  milestoneID: z.string().optional(),
  reviewDecision: z.string().optional(),
  mergeable: z.string().optional(),
  mergeStateStatus: z.string().optional(),
  mergedAt: z.string().nullable(),
  authorLogin: z.string().optional(),
  authorAvatarUrl: z.string().optional(),
  isDraft: z.boolean().optional(),
});

export const PullRequestSchema = z.preprocess(preprocessPullRequest, PullRequestBaseSchema);

export type TPullRequest = z.infer<typeof PullRequestSchema>;

export const PullRequestReportSchema = z.object({
  merged: z.array(PullRequestSchema).nullable(),            
  in_progress: z.array(PullRequestSchema).nullable(),      
  reviewed: z.array(PullRequestSchema).nullable(),        
  waiting_for_review: z.array(PullRequestSchema).nullable(),
  blocked: z.array(PullRequestSchema).nullable(),        
});

export type TPullRequestReport = z.infer<typeof PullRequestReportSchema>;

const preprocessCommit = (data: unknown) => {
  if (!data || typeof data !== 'object') return data;
  const _data = data as any;
  return {
    ..._data,
    createdAt: _data.createdAt ?? _data.CreatedAt,
    updatedAt: _data.updatedAt ?? _data.UpdatedAt,
    id: _data.id ?? _data.ID,
    authorID: _data.authorID ?? _data.AuthorID,
    url: _data.url ?? _data.URL,
  };
};

export const CommitBaseSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  authorID: z.string(),
  url: z.string().url(),
  author: UserSchema.nullish(),
  title: z.string(),
});

export const CommitSchema = z.preprocess(preprocessCommit, CommitBaseSchema);

export type TCommit = z.infer<typeof CommitSchema>;

export const EnhancedBaseUserSchema = UserBaseSchema.extend({
  commits: z.array(CommitSchema).nullish(),
  issues: z.array(IssueSchema).nullish(),
  pullRequests: z.array(PullRequestSchema).nullish(),
  LastContribution: IssueSchema.or(PullRequestSchema).or(CommitSchema).nullish(),
});

export const EnhancedUserSchema = z.preprocess(preprocessUser, EnhancedBaseUserSchema);

export type TEnhancedUser = z.infer<typeof EnhancedUserSchema>;

export const EnhancedUserWithStatsSchema = z.preprocess(
  preprocessUser,
  EnhancedBaseUserSchema.extend({
    TotalCommits: z.number().default(0),
    TotalPrs: z.number().default(0),
    TotalIssues: z.number().default(0),
    TotalReviewedPullRequests: z.number().default(0),
    score: z.number().default(0),
  }),
);

export type TEnhancedUserWithStats = z.infer<typeof EnhancedUserWithStatsSchema>;

const preprocessMilestone = (data: unknown) => {
  if (!data || typeof data !== 'object') return data;
  const _data = data as any;
  return { ..._data, user: _data.user, url: _data.url ?? _data.URL };
};

export const MilestoneSchema = z.preprocess(
  preprocessMilestone,
  z.object({
    id: z.coerce.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    number: z.number(),
    title: z.string(),
    state: z.string(),
    authorID: z.string(),
    author: UserSchema.nullish(),
    description: z.string(),
    url: z.string(),
    issues: z.array(IssueSchema),
  }),
);

export type TMilestone = z.infer<typeof MilestoneSchema>;

export const RepositorySchema = z.object({
  id: z.string(),
  name: z.string(),
  owner: z.string(),
  baseBranch: z.string(),
});

export type TRepository = z.infer<typeof RepositorySchema>;

export const ContributorActivitySchema = z.object({
  title: z.string(),
  url: z.string().url(),
  createdAt: z.string(),
  repository: z.string(),
  type: z.enum(['pull_request', 'issue']),
});

export const ContributorRepositorySchema = z.object({
  nameWithOwner: z.string(),
  description: z.string(),
  url: z.string().url(),
  stargazerCount: z.number(),
  primaryLanguage: z.string(),
});

export const TimeCountSchema = z.object({
  period: z.string(),
  count: z.number(),
});

export const TopContributedRepo = z.object({
  id: z.string(),
  contributions: z.number(),
});

export const ContributorSchema = z.object({
  id: z.string(),
  login: z.string(),
  avatarUrl: z.string().url(),
  url: z.string().url(),
  name: z.string(),
  bio: z.string(),
  location: z.string(),
  joinDate: z.string(),
  websiteUrl: z.string().optional(),
  twitterUsername: z.string().optional(),
  totalStars: z.number(),
  totalRepos: z.number(),
  followers: z.number(),
  following: z.number(),
  totalCommits: z.number(),
  totalPullRequests: z.number(),
  totalIssues: z.number(),
  recentIssues: z.array(ContributorActivitySchema),
  recentPullRequests: z.array(ContributorActivitySchema),
  topRepositories: z.array(ContributorRepositorySchema),
  gnoBalance: z.string(),
  wallet: z.string(),
  commitsPerMonth: z.array(TimeCountSchema),
  pullRequestsPerMonth: z.array(TimeCountSchema),
  issuesPerMonth: z.array(TimeCountSchema),
  contributionsPerDay: z.array(TimeCountSchema),
  topContributedRepositories: z.array(TopContributedRepo)
});

export type TContributorRepository = z.infer<typeof ContributorRepositorySchema>;
export type TTopContributedRepo = z.infer<typeof TopContributedRepo>;

/**
 * Represents a count of contributions over a specified time period.
 */
export type TTimeCount = z.infer<typeof TimeCountSchema>;
export type TContributor = z.infer<typeof ContributorSchema>;
export type TContributorActivity = z.infer<typeof ContributorActivitySchema>;

/**
 * Represents a package contribution.
 */
export const PackageSchema = z.object({
  address: z.string(),
  path: z.string(),
  namespace: z.string(),
  blockHeight: z.number(),
});
export const PackagesSchema = z.array(PackageSchema);

export type TPackage = z.infer<typeof PackageSchema>;
export type TPackages = z.infer<typeof PackagesSchema>;

/**
 * Represents a namespace contribution.
 */
export const NamespaceSchema = z.object({
  hash:        z.string(),
  namespace:   z.string(),
  address:     z.string(),
  blockHeight: z.number(),
});
export const NamespacesSchema = z.array(NamespaceSchema);

export type TNamespace = z.infer<typeof NamespaceSchema>;
export type TNamespaces = z.infer<typeof NamespacesSchema>;

export const ScoreFactorsSchema = z.object({
  prFactor: z.number(),
  issueFactor: z.number(),
  commitFactor: z.number(),
  reviewedPrFactor: z.number(),
});

export type TScoreFactors = z.infer<typeof ScoreFactorsSchema>;

export const YoutubePlaylistIdSchema = z.string();
export type TYoutubePlaylistId = z.infer<typeof YoutubePlaylistIdSchema>;

const ThumbnailSchema = z.object({
  url: z.string(),
  width: z.number(),
  height: z.number(),
});

export const YoutubeVideoSchema = z.object({
  publishedAt: z.string(),
  channelId: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnails: z.object({
    default: ThumbnailSchema,
    medium: ThumbnailSchema,
    high: ThumbnailSchema,
    standard: ThumbnailSchema,
    maxres: ThumbnailSchema,
  }),
  channelTitle: z.string(),
  playlistId: z.string(),
  position: z.number(),
  resourceId: z.object({ kind: z.string(), videoId: z.string() }),
  videoOwnerChannelTitle: z.string(),
  videoOwnerChannelId: z.string()
});
export type TYoutubeVideo = z.infer<typeof YoutubeVideoSchema>;

export const YoutubeVideoPlaylistSchema = z.array(z.object({
  kind: z.string(),
  etag: z.string(),
  id: YoutubePlaylistIdSchema,
  snippet: YoutubeVideoSchema,
}));
export type TYoutubeVideoPlaylist = z.infer<typeof YoutubeVideoPlaylistSchema>;