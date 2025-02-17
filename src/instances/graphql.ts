import { graphql as graphqlClient } from '@octokit/graphql';

import ENV from '@/env';

const graphql = graphqlClient.defaults({
  headers: { authorization: `token ${ENV.GITHUB_API_TOKEN}` },
});

export default graphql;
