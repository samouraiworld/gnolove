import { TPullRequest } from '@/utils/schemas';
import { CheckCircle2, AlertTriangle, Info, SlidersHorizontal, CircleHelp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import NextLink from 'next/link';
import { Status, STATUS_ORDER } from './report-client-page';
import MinecraftHeart from '@/images/minecraft-heart.png';

const STATUS_TOOLTIPS: Record<Status, string> = {
  blocked: 'PRs is technically mergeable but blocked.',
  in_progress: 'PRs is open but hasn’t been approved or is not ready to be merged yet.',
  merged: 'PRs has been merged into the target branch.',
  reviewed: 'PRs has been approved but hasn’t been merged yet.',
  waiting_for_review: 'PRs is open and still requires a review.',
};

const REVIEW_DECISION_ICON_MAP = {
  APPROVED: <CheckCircle2 className="text-green-600 h-4 w-4" />,
  CHANGES_REQUESTED: <AlertTriangle className="text-orange-600 h-4 w-4" />,
  REVIEW_REQUIRED: <CircleHelp className="text-blue-600 h-4 w-4" />,
  '': <></>,
};

interface RepoPRStatusListProps {
  repo: string;
  statusMap: { [status: string]: TPullRequest[] };
  isOffline: boolean;
}

const RepoPRStatusList = ({ repo, statusMap, isOffline }: RepoPRStatusListProps) => {
  return (
    <div key={repo} className="mb-5 pl-0 sm:pl-4">
      <h3 className="sticky top-[25px] z-20 py-1 bg-background text-base font-semibold">
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          {repo}
        </span>
      </h3>
      <div className="flex flex-col gap-4">
        {STATUS_ORDER.map((status) =>
          statusMap[status] && statusMap[status].length > 0 ? (
            <div key={status} className="pl-0 sm:pl-2">
              <div className="sticky top-[55px] z-10 w-full bg-background py-1 text-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h4 className="inline-block cursor-help text-sm font-bold text-muted-foreground">
                      {status.replace(/_/g, ' ').toUpperCase()}
                    </h4>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">{STATUS_TOOLTIPS[status]}</TooltipContent>
                </Tooltip>
              </div>
              <ul className="sm:pl-4">
                {[...statusMap[status]]
                  .sort((a, b) => {
                    const aLogin = a.authorLogin || '';
                    const bLogin = b.authorLogin || '';
                    return aLogin.localeCompare(bLogin);
                  })
                  .map((pr: TPullRequest) => (
                    <li key={pr.id} className="hover:bg-muted/50">
                      <div className="flex flex-col overflow-hidden py-2 sm:flex-row sm:items-center sm:py-1 gap-2">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 overflow-hidden rounded-full">
                            <Avatar>
                              <AvatarImage src={pr.authorAvatarUrl} alt={pr.authorLogin || ''} />
                              <AvatarFallback>{pr.authorLogin ? pr.authorLogin[0] : '?'}</AvatarFallback>
                            </Avatar>
                          </div>
                          <NextLink className="flex items-center" href={isOffline ? '' : `/@${pr.authorLogin}`}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-sm font-bold">{pr.authorLogin}</span>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">{pr.authorLogin}</TooltipContent>
                            </Tooltip>
                          </NextLink>
                        </div>
                        <a className="flex items-center" href={isOffline ? '' : pr.url} target="_blank" rel="noopener noreferrer">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm">{pr.title}</span>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs max-w-sm">{pr.title}</TooltipContent>
                          </Tooltip>
                        </a>
                        <div className="ml-auto flex items-center gap-4">
                          {(pr.reviews?.length ?? 0) > 10 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-block">
                                  <Image src={MinecraftHeart} alt="minecraft heart " width={12} height={12} />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">{`Loved PR, Reviewed more than ${pr.reviews?.length ?? 0} times`}</TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="hidden sm:block">
                                {
                                  REVIEW_DECISION_ICON_MAP[
                                    (pr.reviewDecision && ['APPROVED', 'CHANGES_REQUESTED', 'REVIEW_REQUIRED'].includes(pr.reviewDecision)
                                      ? pr.reviewDecision
                                      : '') as 'APPROVED' | 'CHANGES_REQUESTED' | 'REVIEW_REQUIRED' | ''
                                  ]
                                }
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">{pr.reviewDecision || 'No review decision'}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Info className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md text-xs">
                              <div className="flex flex-col gap-2 p-1">
                                <span className="text-sm font-bold">{pr.title}</span>
                                <span className="text-xs font-bold text-muted-foreground">PR #{pr.number} • {pr.state}</span>
                                <span className="text-xs text-muted-foreground"><span className="font-bold">Author: </span>{pr.authorLogin}</span>
                                <span className="text-xs text-muted-foreground"><span className="font-bold">Review Decision: </span>{pr.reviewDecision || 'N/A'}</span>
                                <span className="text-xs text-muted-foreground"><span className="font-bold">Created: </span>{pr.createdAt ? new Date(pr.createdAt).toLocaleString() : 'N/A'}</span>
                                <span className="text-xs text-muted-foreground"><span className="font-bold">Updated: </span>{pr.updatedAt ? new Date(pr.updatedAt).toLocaleString() : 'N/A'}</span>
                                <span className="text-xs text-muted-foreground"><span className="font-bold">URL: </span><a href={pr.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{pr.url}</a></span>
                                <span className="text-xs text-muted-foreground"><span className="font-bold">Reviewed: </span>{pr.reviews?.length} times</span>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <Separator className="my-2" />
                    </li>
                  ))}
              </ul>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
};

export default RepoPRStatusList;