import { Box, Flex, Text, Tooltip } from '@radix-ui/themes';
import { useMemo } from 'react';

type HeatmapDay = {
  date: string;
  contributions: number;
};

const getContributionLevel = (contributions: number) => {
  if (contributions === 0) return 0;
  if (contributions <= 2) return 1;
  if (contributions <= 5) return 2;
  if (contributions <= 8) return 3;
  return 4;
};

const ContributionSquare = ({ level, date, count }: { level: number; date: Date; count: number }) => {
  const getColor = (level: number) => {
    switch (level) {
      case 0:
        return '#ebedf0';
      case 1:
        return '#9be9a8';
      case 2:
        return '#40c463';
      case 3:
        return '#30a14e';
      case 4:
        return '#216e39';
      default:
        return '#ebedf0';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTooltipContent = () => {
    if (count === 0) {
      return `No contributions on ${formatDate(date)}`;
    } else if (count === 1) {
      return `1 contribution on ${formatDate(date)}`;
    } else {
      return `${count} contributions on ${formatDate(date)}`;
    }
  };

  return (
    <Tooltip content={getTooltipContent()}>
      <Box
        width='10px'
        height='10px'
        style={{
          backgroundColor: getColor(level),
          borderRadius: '2px',
          cursor: 'pointer',
        }}
      />
    </Tooltip>
  );
};

// Utility to preprocess data for the heatmap
const getHeatmapWeeks = (data: HeatmapDay[]): HeatmapDay[][] => {
  if (!data.length) return [];
  const today = new Date();
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const firstDate = new Date(sorted[0].date);
  const lastDate = new Date(sorted[sorted.length - 1].date);

  // Pad start
  const firstDayOfWeek = firstDate.getDay();
  const padStart = (firstDayOfWeek + 6) % 7;
  const padded = [
    ...Array.from({ length: padStart }, (_, i) => {
      const padDate = new Date(firstDate);
      padDate.setDate(firstDate.getDate() - (padStart - i));
      return { date: padDate.toISOString(), contributions: 0 };
    }),
    ...sorted,
  ];

  // Pad end
  const lastDayOfWeek = lastDate.getDay();
  const padEnd = (7 - ((lastDayOfWeek + 6) % 7) - 1);
  for (let i = 0; i < padEnd; i++) {
    const padDate = new Date(lastDate);
    padDate.setDate(lastDate.getDate() + i + 1);
    padded.push({ date: padDate.toISOString(), contributions: 0 });
  }

  // Remove future dates
  today.setHours(0, 0, 0, 0);
  const filtered = padded.filter(day => {
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);
    return dayDate <= today;
  });

  // Split into weeks
  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < filtered.length; i += 7) {
    weeks.push(filtered.slice(i, i + 7));
  }
  return weeks;
};

const ContributionsHeatmap = ({ data }: { data: HeatmapDay[] }) => {
  const weeks = useMemo(() => getHeatmapWeeks(data), [data]);

  return (
    <Flex direction="column" gap='4' py='2' overflowX="auto">
      {/* Graph grid */}
      {/* Contribution squares */}
      <Flex gap='1'>
        {weeks.map((week, weekIndex) => (
          <Flex key={weekIndex} direction='column' gap='1'>
            {week.map((contribution, dayIndex) => (
              <ContributionSquare
                key={dayIndex}
                level={getContributionLevel(contribution.contributions)}
                date={new Date(contribution.date)}
                count={contribution.contributions}
              />
            ))}
          </Flex>
        ))}
      </Flex>

      {/* Legend */}
      <Flex align='center' gap='2'>
        <Text size='1' color='gray'>
          Less
        </Text>
        <Flex gap='1'>
          <ContributionSquare level={0} date={new Date()} count={0} />
          <ContributionSquare level={1} date={new Date()} count={1} />
          <ContributionSquare level={2} date={new Date()} count={4} />
          <ContributionSquare level={3} date={new Date()} count={8} />
          <ContributionSquare level={4} date={new Date()} count={12} />
        </Flex>
        <Text size='1' color='gray'>
          More
        </Text>
      </Flex>
    </Flex>
  );
};

export default ContributionsHeatmap;
