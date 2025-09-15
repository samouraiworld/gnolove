import { useMemo } from 'react';

import { formatDistanceToNow } from 'date-fns';
import { Calendar, User } from 'lucide-react';

import { deduplicateByKey } from '@/utils/array';
import { TIssue } from '@/utils/schemas';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

const stateBadgeClass = (state: string) => {
  switch (state.toUpperCase()) {
    case 'OPEN':
      return 'bg-green-100 text-green-700';
    case 'CLOSED':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const labelBgStyle = (color: string) => {
  // GitHub labels are often hex color without '#'
  const hex = color?.match(/^[0-9a-fA-F]{6}$/) ? `#${color}` : undefined;
  return hex ? { backgroundColor: hex, color: '#000', border: '1px solid rgba(0,0,0,0.1)' } : {};
};

const MilestoneListItem = ({ issue }: { issue: TIssue }) => {
  const labels = useMemo(() => deduplicateByKey(issue.labels, (l) => l.name), [issue.labels]);
  const assignees = useMemo(() => deduplicateByKey(issue.assignees, (a) => a.user.id), [issue.assignees]);

  return (
    <Card className="h-[250px] flex flex-col">
      <CardContent className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex min-h-[6em] flex-grow flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <a
                href={issue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground text-sm hover:underline"
              >
                #{issue.number}
              </a>
              <Badge className={`h-5 px-2 text-xs ${stateBadgeClass(issue.state)}`}>{issue.state}</Badge>
            </div>
          </div>

          <a href={issue.url} target="_blank" rel="noopener noreferrer" className="line-clamp-2 text-lg font-bold">
            {issue.title}
          </a>

          {(assignees.length > 0 || labels.length > 0) && (
            <div className="mt-auto">
              {labels.length > 0 && (
                <div className="relative mt-2 flex max-h-[72px] flex-wrap gap-1 overflow-hidden">
                  {labels.map((label, index) => (
                    <Badge key={index} className="h-5 px-2 text-[11px]" style={labelBgStyle(label.color)}>
                      {label.name}
                    </Badge>
                  ))}
                  {labels.length > 5 && (
                    <div
                      className="pointer-events-none absolute bottom-0 left-0 h-6 w-full"
                      style={{
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, var(--background) 90%)',
                        zIndex: 1,
                      }}
                    />
                  )}
                </div>
              )}

              {assignees.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground text-sm">Assignees:</span>
                  {assignees.map(({ user }) => (
                    <Tooltip key={user.id}>
                      <TooltipTrigger asChild>
                        <a href={user.url} target="_blank" rel="noopener noreferrer">
                          <div className="h-6 w-6 overflow-hidden rounded-full">
                            <Avatar>
                              <AvatarImage src={user.avatarUrl} alt={user.login} />
                              <AvatarFallback>
                                <User className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </a>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">{user.login}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <Separator className="mx-3" />

      <CardFooter className="justify-between px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 overflow-hidden rounded-full">
            <Avatar>
              <AvatarImage src={issue.author?.avatarUrl || ''} alt={issue.author?.login || 'unknown'} />
              <AvatarFallback>
                <User className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
          </div>
          <span className="text-muted-foreground text-sm">{issue.author?.login ?? 'Unknown'}</span>
        </div>

        {issue.createdAt && (
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" />
            <span>{formatDistanceToNow(issue.createdAt, { addSuffix: true })}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default MilestoneListItem;
