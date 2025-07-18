import { ExternalLinkIcon } from '@radix-ui/react-icons';
import { Flex, FlexProps, Progress, Text } from '@radix-ui/themes';

import { TMilestone } from '@/utils/schemas';

export interface MilestoneProgressProps {
  milestone: TMilestone;
}

const MilestoneProgress = ({ milestone, ...props }: MilestoneProgressProps & FlexProps) => {
  const closedIssues = milestone.issues.filter(({ state }) => state === 'CLOSED');
  const openIssues = milestone.issues.filter(({ state }) => state === 'OPEN');

  const progress = (closedIssues.length / (openIssues.length + closedIssues.length)) * 100;

  return (
    <Flex direction="column" gap="2" {...props}>
      <Flex align="center" justify="center" gap="2">
        <Text weight="bold">
          {milestone.title} ({progress.toFixed(2)}%)
        </Text>
        <ExternalLinkIcon className="text-blue-10" />
      </Flex>

      <Progress className="w-full" color="green" value={progress} />
    </Flex>
  );
};

export default MilestoneProgress;
