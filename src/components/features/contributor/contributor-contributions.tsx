import React from 'react';

import { TContributor } from '@/utils/schemas';

const ContributorContributions = ({ contributor }: { contributor: TContributor }) => {
  return (
    <div className="h-full rounded-md border p-4">
      <div className="flex h-full flex-col gap-4 overflow-y-auto">
        <h3 className="text-lg font-semibold">Contribution Overview</h3>
        <div className="flex w-1/2 flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Repositories</span>
            <span className="text-sm font-medium">{contributor.totalRepos}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Followers</span>
            <span className="text-sm font-medium">{contributor.followers}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Following</span>
            <span className="text-sm font-medium">{contributor.following}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributorContributions;
