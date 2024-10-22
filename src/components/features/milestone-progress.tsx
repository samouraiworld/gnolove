import { ExternalLinkIcon } from '@radix-ui/react-icons';
import { Flex, FlexProps, Progress, Text } from '@radix-ui/themes';

import { Milestone } from '@/type/github';

export interface MilestoneProgressProps {
  milestone: Milestone;
}

const MilestoneProgress = ({ milestone, ...props }: MilestoneProgressProps & FlexProps) => {
  return (
    <Flex direction="column" gap="2" {...props}>
      <Flex align="center" justify="center" gap="2">
        <Text className="italic">{milestone.title}</Text>
        <ExternalLinkIcon className="text-blue-10" />
      </Flex>

      <Progress
        className="w-full"
        value={(milestone.closed_issues / (milestone.open_issues + milestone.closed_issues)) * 100}
      />
    </Flex>
  );
};

export default MilestoneProgress;
