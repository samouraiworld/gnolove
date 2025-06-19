import { Box, Flex, Text, Tooltip } from '@radix-ui/themes';

type HeatmapDay = {
  date: string;
  contributions: number;
  day: number;
  week: number;
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

const ContributionsHeatmap = ({ data }: { data: HeatmapDay[] }) => {

  // Group data by weeks
  const weeks: any[] = [];
  let currentWeek: any[] = [];

  data.forEach((day: any, index: number) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === data.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  return (
    <Flex direction="column" gap='4' py='2' overflowX="auto">
      {/* Graph grid */}
      {/* Contribution squares */}
      <Flex gap='1'>
        {Array.from({ length: 53 }, (_, weekIndex) => (
          <Flex key={weekIndex} direction='column' gap='1'>
            {Array.from({ length: 7 }, (_, dayIndex) => {
              const dataIndex = weekIndex * 7 + dayIndex;
              const contribution = data[dataIndex];

              if (!contribution) {
                return <ContributionSquare key={dayIndex} level={0} date={new Date()} count={0} />;

              }

              return (
                <ContributionSquare
                  key={dayIndex}
                  level={getContributionLevel(contribution.contributions)}
                  date={new Date(contribution.date)}
                  count={contribution.contributions}
                />
              );
            })}
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
