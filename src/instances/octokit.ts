import { Octokit } from '@octokit/rest';

import ENV from '@/env';

const octokit = new Octokit({
  auth: ENV.GITHUB_API_TOKEN,
});

export default octokit;
