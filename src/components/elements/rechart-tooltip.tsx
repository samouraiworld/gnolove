import React from 'react';

import { Card, Box, Flex, Text } from '@radix-ui/themes';
import { type TooltipProps } from 'recharts';

// @TODO remove the any typing when recharts allows for better typing. (unknown typing doesn't satisfy ValueType constraints)
interface RechartTooltipProps extends TooltipProps<any, string | number> {
  /**
   * Optional custom render function for entries.
   * If not provided, will render name, value, and color.
   */
  renderEntries?: (payload: unknown[], label?: string | number) => React.ReactNode;
  /** Optional: override label rendering */
  renderLabel?: (label?: string | number, payload?: unknown[]) => React.ReactNode;
}

const RechartTooltip = (props: RechartTooltipProps) => {
  const { active, payload, label, renderEntries, renderLabel } = props;
  if (!active || !payload || !payload.length) return null;

  return (
    <Card>
      <Box mb="2">
        {renderLabel ? (
          renderLabel(label, payload)
        ) : (
          <Text size="2" weight="bold">
            {label}
          </Text>
        )}
      </Box>
      <Flex direction="column" gap="2">
        {renderEntries
          ? renderEntries(payload, label)
          : payload.map((entry: any, i: number) => (
              <Flex key={i} gap="2">
                <Text size="1" style={{ color: entry.color }}>
                  {entry.name}:
                </Text>
                <Text size="1" weight="bold" style={{ color: entry.color }}>
                  {entry.value}
                </Text>
              </Flex>
            ))}
      </Flex>
    </Card>
  );
};

export default RechartTooltip;
