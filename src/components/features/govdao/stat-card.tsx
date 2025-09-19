import { Card, Flex, Heading, Text } from '@radix-ui/themes';

const StatCard = ({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
}) => (
  <Card>
    <Flex direction="column" gap="1">
      <Flex align="center" gap="2">
        {icon && <span>{icon}</span>}
        <Text weight="bold">{title}</Text>
      </Flex>
      <Heading size="6">{value}</Heading>
      {hint && (
        <Text color="gray" size="2">
          {hint}
        </Text>
      )}
    </Flex>
  </Card>
);

export default StatCard;
