import { useMemo } from 'react';

import { CalendarIcon, PersonIcon } from '@radix-ui/react-icons';
import { Avatar, Badge, BadgeProps, Box, Card, Flex, Link, Separator, Text, Tooltip } from '@radix-ui/themes';
import { formatDistanceToNow } from 'date-fns';

import { TIssue } from '@/utils/schemas';

import { deduplicateByKey } from '@/utils/array';

const VALID_COLORS: BadgeProps['color'][] = [
  'gray',
  'gold',
  'bronze',
  'brown',
  'yellow',
  'amber',
  'orange',
  'tomato',
  'red',
  'ruby',
  'crimson',
  'pink',
  'plum',
  'purple',
  'violet',
  'iris',
  'indigo',
  'blue',
  'cyan',
  'teal',
  'jade',
  'green',
  'grass',
  'lime',
  'mint',
  'sky',
];

const getIssueStateColor = (state: string): BadgeProps['color'] => {
  switch (state.toUpperCase()) {
    case 'OPEN':
      return 'green';
    case 'CLOSED':
      return 'gray';
    default:
      return 'gray';
  }
};

const getSafeLabelColor = (color: string): BadgeProps['color'] => {
  return VALID_COLORS.includes(color as BadgeProps['color']) ? (color as BadgeProps['color']) : 'gray';
};

const MilestoneListItem = ({ issue }: { issue: TIssue }) => {
  const labels = useMemo(() => deduplicateByKey(issue.labels, (l) => l.name), [issue.labels]);
  const assignees = useMemo(() => deduplicateByKey(issue.assignees, (a) => a.user.id), [issue.assignees]);

  return (
    <Card size="2" variant="surface" style={{ height: 250 }}>
      <Flex direction="column" height="100%" gap="1" justify="between">
        <Flex direction="column" gap="2" flexGrow="1" minHeight="6em">
          <Flex align="center" justify="between">
            <Flex align="center" gap="2">
              <Link href={issue.url} target="_blank" rel="noopener noreferrer">
                <Text size="2" color="gray">
                  #{issue.number}
                </Text>
              </Link>
              <Badge size="1" color={getIssueStateColor(issue.state)} variant="soft">
                {issue.state}
              </Badge>
            </Flex>
          </Flex>

          <Link href={issue.url} target="_blank" rel="noopener noreferrer">
            <Text
              size="4"
              weight="bold"
              as="div"
              style={{
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'normal',
                maxHeight: '2.8em',
              }}
            >
              {issue.title}
            </Text>
          </Link>

          {(assignees.length > 0 || labels.length > 0) && (
            <Box mt="auto">
              {labels.length > 0 && (
                <Flex gap="1" wrap="wrap" maxHeight="72px" overflow="hidden" position="relative" mt="2">
                  {labels.map((label, index) => (
                    <Badge key={index} size="1" color={getSafeLabelColor(label.color)} variant="soft">
                      {label.name}
                    </Badge>
                  ))}
                  {/* Ellipsis fade for overflow indication */}
                  {labels.length > 5 && (
                    <Box
                      display="block"
                      position="absolute"
                      bottom="0"
                      left="0"
                      width="100%"
                      height="24px"
                      style={{
                        pointerEvents: 'none',
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, #fff 90%)',
                        zIndex: 1,
                      }}
                    />
                  )}
                </Flex>
              )}

              {assignees.length > 0 && (
                <Flex gap="2" align="center" wrap="wrap" mt="3">
                  <Text size="2" color="gray">
                    Assignees:
                  </Text>
                  {assignees.map(({ user }) => (
                    <Tooltip content={user.login} key={user.id}>
                      <Link href={user.url} target="_blank" rel="noopener noreferrer">
                        <Avatar size="1" src={user.avatarUrl} fallback={<PersonIcon />} />
                      </Link>
                    </Tooltip>
                  ))}
                </Flex>
              )}
            </Box>
          )}
        </Flex>

        <Box>
          <Separator size="4" mb="3" mt="3" />
          <Flex align="center" justify="between">
            <Flex align="center" gap="2">
              <Avatar size="1" src={issue.author?.avatarUrl} fallback={<PersonIcon />} />
              <Text size="2" color="gray">
                {issue.author?.login ?? 'Unknown'}
              </Text>
            </Flex>

            {issue.createdAt && (
              <Flex align="center" gap="1">
                <CalendarIcon width="12" height="12" color="gray" />
                <Text size="1" color="gray">
                  {formatDistanceToNow(issue.createdAt, { addSuffix: true })}
                </Text>
              </Flex>
            )}
          </Flex>
        </Box>
      </Flex>
    </Card>
  );
};

export default MilestoneListItem;