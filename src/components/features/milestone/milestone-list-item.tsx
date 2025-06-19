import { CalendarIcon, PersonIcon } from '@radix-ui/react-icons';
import { Avatar, Badge, BadgeProps, Box, Card, Flex, Link, Separator, Text, Tooltip } from '@radix-ui/themes';
import { formatDistanceToNow } from 'date-fns';
import { TIssue } from '@/util/schemas';

const MilestoneListItem = ({ issue }: { issue: TIssue }) => {
  const getIssueStateColor = (state: string): BadgeProps['color'] => {
    switch (state.toUpperCase()) {
      case 'OPEN': return 'green';
      case 'CLOSED': return 'gray';
      default: return 'gray';
    }
  };

  const getSafeLabelColor = (color: string): BadgeProps['color'] => {
    const validColors: BadgeProps['color'][] = ['gray', 'gold', 'bronze', 'brown', 'yellow', 'amber', 'orange', 'tomato', 'red', 'ruby', 'crimson', 'pink', 'plum', 'purple', 'violet', 'iris', 'indigo', 'blue', 'cyan', 'teal', 'jade', 'green', 'grass', 'lime', 'mint', 'sky'];
    return validColors.includes(color as BadgeProps['color']) ? color as BadgeProps['color'] : 'gray';
  };

  return (
    <Card key={issue.id} size='2' variant='surface'>
      <Box>
        <Flex align='start' justify='between' mb='3'>
          <Box>
            <Flex align='center' gap='2' mb='2'>
              <Link href={issue.url} target='_blank'>
                <Text size='2' color='gray'>
                  #{issue.number}
                </Text>
              </Link>
              <Badge size='1' color={getIssueStateColor(issue.state)} variant='soft'>
                {issue.state}
              </Badge>
            </Flex>
            <Link href={issue.url} target='_blank'>
              <Text size='3' weight='medium'>
                {issue.title}
              </Text>
            </Link>
          </Box>
        </Flex>

        {issue.labels.length > 0 && (
          <Flex gap='1' mb='3' wrap='wrap'>
            {issue.labels.map((label, index) => (
              <Badge key={index} size='1' color={getSafeLabelColor(label.color)} variant='soft'>
                {label.name}
              </Badge>
            ))}
          </Flex>
        )}

        <Separator size='4' mb='3' />

        <Flex direction='column' gap='4'>
          <Flex align='center' justify='between'>
            <Flex align='center' gap='2'>
              <Avatar size='1' src={issue.author?.avatarUrl} fallback={<PersonIcon />} />
              <Text size='2' color='gray'>
                {issue.author?.login}
              </Text>
            </Flex>
            <Flex align='center' gap='1'>
              <CalendarIcon width='12' height='12' color='gray' />
              <Text size='1' color='gray'>
                {formatDistanceToNow(issue.createdAt, { addSuffix: true })}
              </Text>
            </Flex>
          </Flex>
          {issue.assignees.length > 0 && (
            <Flex gap='1' wrap='wrap' align='center'>
              <Text size='2' color='gray'>
                Assignees:
              </Text>
              {issue.assignees.map(({ user }) => (
                <Tooltip content={user.login} key={user.id}>
                  <Avatar size='1' src={user.avatarUrl} fallback={<PersonIcon />} />
                </Tooltip>
              ))}
            </Flex>
          )}
        </Flex>
      </Box>
    </Card>
  );
};

export default MilestoneListItem;