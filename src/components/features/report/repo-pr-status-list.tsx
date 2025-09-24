import { TPullRequest } from '@/utils/schemas';
import { CheckCircledIcon, ExclamationTriangleIcon, InfoCircledIcon, LapTimerIcon, MixerHorizontalIcon, QuestionMarkCircledIcon } from '@radix-ui/react-icons';
import { Avatar, Box, Flex, Heading, Link, Text, Tooltip, HoverCard, IconButton, Separator } from '@radix-ui/themes';
import Image from 'next/image';
import { Status, STATUS_ORDER } from './report-client-page';
import MinecraftHeart from '@/images/minecraft-heart.png';
import { differenceInWeeks } from 'date-fns';


const STATUS_TOOLTIPS: Record<Status, string> = {
  blocked: 'PRs is technically mergeable but blocked.',
  in_progress: 'PRs is open but hasn’t been approved or is not ready to be merged yet.',
  merged: 'PRs has been merged into the target branch.',
  reviewed: 'PRs has been approved but hasn’t been merged yet.',
  waiting_for_review: 'PRs is open and still requires a review.',
};

const REVIEW_DECISION_ICON_MAP = {
  APPROVED: <CheckCircledIcon color="green" />,
  CHANGES_REQUESTED: <ExclamationTriangleIcon color="orange" />,
  REVIEW_REQUIRED: <QuestionMarkCircledIcon color="blue" />,
  '': <></>,
};

interface RepoPRStatusListProps {
  repo: string;
  statusMap: { [status: string]: TPullRequest[] };
  isOffline: boolean;
}

const weeksAgo = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  return differenceInWeeks(now, date);
};

const RepoPRStatusList = ({ repo, statusMap, isOffline }: RepoPRStatusListProps) => {
  return (
    <Box key={repo} mb="5" pl={{ initial: '0', sm: '4' }}>
      <Heading as="h3" size="4" style={{ backgroundColor: 'var(--color-background)' }} className="sticky top-[25px] z-20 py-1">
        <Flex align="center" gap="2">
          <MixerHorizontalIcon />
          {repo}
        </Flex>
      </Heading>
      <Flex direction="column" gap="4">
        {STATUS_ORDER.map((status) =>
          statusMap[status] && statusMap[status].length > 0 ? (
            <Box key={status} pl={{ initial: '0', sm: '2' }}>
              <Box
                width="100%"
                style={{ backgroundColor: 'var(--color-background)' }}
                className="sticky top-[55px] z-10 py-1 text-center"
              >
                <Tooltip content={STATUS_TOOLTIPS[status]}>
                  <Heading as="h4" size="2" weight="bold" color="gray" className="inline-block cursor-help">
                    {status.replace(/_/g, ' ').toUpperCase()}
                  </Heading>
                </Tooltip>
              </Box>
              <ul className="sm:pl-4">
                {[...statusMap[status]]
                  .sort((a, b) => {
                    const aLogin = a.authorLogin || '';
                    const bLogin = b.authorLogin || '';
                    return aLogin.localeCompare(bLogin);
                  })
                  .map((pr: TPullRequest) => (
                    <li key={pr.id} className="hover:bg-gray-2">
                      <Flex
                        gap="2"
                        align={{ initial: 'start', sm: 'center' }}
                        py={{ initial: '2', sm: '1' }}
                        className="overflow-hidden"
                        direction={{ initial: 'column', sm: 'row' }}
                      >
                        <Flex gap="2">
                          <Avatar
                            size="1"
                            radius="full"
                            src={pr.authorAvatarUrl}
                            fallback={pr.authorLogin ? pr.authorLogin[0] : '?'}
                          />
                          <Link className="flex items-center" href={isOffline ? '' : `/@${pr.authorLogin}`}>
                            <Tooltip content={pr.authorLogin}>
                              <Text
                                weight="bold"
                                size="2"
                              >
                                {pr.authorLogin}
                              </Text>
                            </Tooltip>
                          </Link>
                        </Flex>
                        <Link className="flex items-center" href={isOffline ? '' : pr.url} target="_blank" rel="noopener noreferrer">
                          <Tooltip content={pr.title}>
                            <Text
                              size="2"
                            >
                              {pr.title}
                            </Text>
                          </Tooltip>
                        </Link>
                        <Flex ml="auto" align="center" gap="4">
                          {pr.createdAt && weeksAgo(pr.createdAt) > 24 && (
                            <Tooltip content={`Old PR, created ${weeksAgo(pr.createdAt)} weeks ago`}>
                              <Text size="2">
                                <LapTimerIcon color="gray" />
                              </Text>
                            </Tooltip>
                          )}
                          {(pr.reviews?.length ?? 0) > 10 && (
                            <Tooltip content={`Loved PR, Reviewed more than ${pr.reviews?.length ?? 0} times`}>
                              <Text size="2">
                                <Image src={MinecraftHeart} alt="minecraft heart " width={12} height={12} />
                              </Text>
                            </Tooltip>
                          )}
                          <Tooltip content={pr.reviewDecision || 'No review decision'}>
                            <Text className="sm:block hidden">
                              {
                                REVIEW_DECISION_ICON_MAP[
                                (pr.reviewDecision &&
                                  ['APPROVED', 'CHANGES_REQUESTED', 'REVIEW_REQUIRED'].includes(pr.reviewDecision)
                                  ? pr.reviewDecision
                                  : '') as 'APPROVED' | 'CHANGES_REQUESTED' | 'REVIEW_REQUIRED' | ''
                                ]
                              }
                            </Text>
                          </Tooltip>
                          <HoverCard.Root>
                            <HoverCard.Trigger>
                              <IconButton variant="soft">
                                <InfoCircledIcon />
                              </IconButton>
                            </HoverCard.Trigger>
                            <HoverCard.Content width="360px">
                              <Flex direction="column" gap="2" p="2">
                                <Text size="2" weight="bold">
                                  {pr.title}
                                </Text>
                                <Text size="1" weight="bold" color="gray">
                                  PR #{pr.number} • {pr.state}
                                </Text>
                                <Text size="1" color="gray">
                                  <Text weight="bold">Author: </Text> {pr.authorLogin}
                                </Text>
                                <Text size="1" color="gray">
                                  <Text weight="bold">Review Decision: </Text> {pr.reviewDecision || 'N/A'}
                                </Text>
                                <Text size="1" color="gray">
                                  <Text weight="bold">Created: </Text>{' '}
                                  {pr.createdAt ? new Date(pr.createdAt).toLocaleString() : 'N/A'}
                                </Text>
                                <Text size="1" color="gray">
                                  <Text weight="bold">Updated: </Text>{' '}
                                  {pr.updatedAt ? new Date(pr.updatedAt).toLocaleString() : 'N/A'}
                                </Text>
                                <Text size="1" color="gray">
                                  <Text weight="bold">URL: </Text>{' '}
                                  <Link href={pr.url} target="_blank" rel="noopener noreferrer">
                                    {pr.url}
                                  </Link>
                                </Text>
                                <Text size="1" color="gray">
                                  <Text weight="bold">Reviewed: </Text> {pr.reviews?.length} times
                                </Text>
                              </Flex>
                            </HoverCard.Content>
                          </HoverCard.Root>
                        </Flex>
                      </Flex>
                      <Separator size="4" />
                    </li>
                  ))}
              </ul>
            </Box>
          ) : null,
        )}
      </Flex>
    </Box>
  );
};

export default RepoPRStatusList;