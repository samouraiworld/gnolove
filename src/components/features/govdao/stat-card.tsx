import { Card, Flex, Heading, Text } from '@radix-ui/themes';

const StatCard = ({ title, value, hint }: { title: string; value: string | number; hint?: string }) => (
  <Card>
    <Flex direction="column" gap="1">
      <Text weight="bold">{title}</Text>
      <Heading size="6">{value}</Heading>
      {hint && (
        <Text color="gray" size="2">{hint}</Text>
      )}
    </Flex>
  </Card>
);

export default StatCard;
