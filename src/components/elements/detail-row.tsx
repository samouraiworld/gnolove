import { Flex, Text } from "@radix-ui/themes";


const DetailRow = ({ label, value }: { label: string; value: string | React.ReactNode }) => (
  <Flex justify="between" wrap="wrap" align="center">
    <Text color="gray">{label}</Text>
    {typeof value === 'string' ? <Text>{value}</Text> : value}
  </Flex>
);

export default DetailRow;