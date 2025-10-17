import Copyable from '@/elements/copyable';
import useGetUsers from '@/hooks/use-get-users';
import { Badge, BadgeProps, Card, Flex } from '@radix-ui/themes';

const ProposalVotes = ({ votes }: { votes: Array<{ address: string; vote: string; proposalID: string | number; hash: string; blockHeight: number }> }) => {
  const addresses = votes.map((v) => v.address);
  const { data: users } = useGetUsers(addresses);

  const getUser = (address: string) => users?.find((user) => user.wallet === address);

  return (
    <Flex direction="column" gap="2">
      {[...votes]
        .sort((a, b) => b.blockHeight - a.blockHeight)
        .map((v) => {
          const color: BadgeProps['color'] = v.vote === 'YES' ? 'green' : v.vote === 'NO' ? 'red' : 'gray';
          return (
            <Card key={`${v.proposalID}-${v.address}-${v.hash}`} className="p-2">
              <Flex align="center" justify="between">
                <Flex direction="column">
                  <Copyable className="font-bold">{getUser(v.address)?.login || getUser(v.address)?.name || v.address}</Copyable>
                </Flex>
                <Badge color={color} variant="soft">{v.vote}</Badge>
              </Flex>
            </Card>
          );
        })}
    </Flex>
  );
};

export default ProposalVotes;