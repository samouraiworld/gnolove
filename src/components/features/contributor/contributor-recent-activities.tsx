import Link from 'next/link';

import { ExternalLink, GitPullRequest, MessageSquare } from 'lucide-react';

import { TContributor } from '@/utils/schemas';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const ContributorRecentActivities = ({ contributor }: { contributor: TContributor }) => {
  return (
    <div className="h-full rounded-md border p-4">
      <div className="flex h-full flex-col gap-4 overflow-y-auto">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <div className="flex flex-col gap-4">
          {[...contributor.recentIssues, ...contributor.recentPullRequests]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((activity) => (
              <div key={`${activity.type}-${activity.title}`} className="flex items-start gap-3">
                <div className="mt-1">
                  {activity.type === 'pull_request' && <GitPullRequest size={16} color="blue" />}
                  {activity.type === 'issue' && <MessageSquare size={16} color="orange" />}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{activity.repository}</span>
                    <Badge variant="outline" className="h-5 px-2 text-[11px]">
                      {activity.type}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground text-sm">{activity.title}</span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(activity.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <Link href={activity.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon">
                    <ExternalLink size={12} />
                  </Button>
                </Link>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ContributorRecentActivities;
