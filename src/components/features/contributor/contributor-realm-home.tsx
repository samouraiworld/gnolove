import { Card, Flex, Heading, Text, Grid, Box } from '@radix-ui/themes';
import { TContributor } from '@/util/schemas';
import RadixMarkdown from '@/components/elements/radix-markdown';

const parseGnoContent = (content: string) => {
  const titleMatch = content.match(/^\*\*(.*?)\*\*/);
  let title = '';
  let remainingContent = content;
  
  if (titleMatch) {
    title = titleMatch[1].trim();
    remainingContent = content.replace(titleMatch[0], '').trim();
  }
  
  const gnoColumnsRegex = /<gno-columns>([\s\S]*?)<\/gno-columns>/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = gnoColumnsRegex.exec(remainingContent)) !== null) {
    if (match.index > lastIndex) {
      const beforeContent = remainingContent.slice(lastIndex, match.index).trim();
      if (beforeContent) {
        parts.push({ type: 'content', content: beforeContent });
      }
    }
    
    const columnsContent = match[1].trim();
    if (columnsContent) {
      parts.push({ type: 'columns', content: columnsContent });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < remainingContent.length) {
    const afterContent = remainingContent.slice(lastIndex).trim();
    if (afterContent) {
      parts.push({ type: 'content', content: afterContent });
    }
  }
  
  return { title, parts };
};

const GnoColumns = ({ content }: { content: string }) => {
  const columns = content.split('|||').map(col => col.trim()).filter(col => col);
  
  const getColumnSpan = () => {
    switch (columns.length) {
      case 1: return '1';
      case 2: return { initial: '1', sm: '2' };
      case 3: return { initial: '1', sm: '2', md: '3' };
      default: return { initial: '1', sm: '2', md: '3', lg: '4' };
    }
  };
  
  return (
    <Grid columns={getColumnSpan()} gap='4' my='4'>
      {columns.map((column, index) => (
        <Box 
          key={index} 
          className="p-4 rounded-lg"
        >
          <div className="prose-sm">
            <RadixMarkdown>
              {column}
            </RadixMarkdown>
          </div>
        </Box>
      ))}
    </Grid>
  );
};

const ContributorRealmHome = ({ contributor }: { contributor: TContributor }) => {
  if (!contributor.renderOutput || contributor.renderOutput.trim() === "") {
    return (
      <Card style={{ height: '100%' }}>
        <Flex direction='column' gap='4' p='4' height='100%' justify='center' align='center'>
          <Text size='2' color='gray' align='center'>
            No realm home profile yet
          </Text>
        </Flex>
      </Card>
    );
  }

  const parsed = parseGnoContent(contributor.renderOutput);

  return (
    <Card style={{ height: '100%' }}>
      <Flex direction='column' gap='4' p='4' height='100%' overflowY='auto'>
        {parsed.title && (
          <Flex direction="column" gap="2">
            <Heading size='5' className="text-center">
              {parsed.title}
            </Heading>
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
          </Flex>
        )}
        
        <Flex direction='column' gap='3' className="flex-1">
          {parsed.parts.map((part, index) => (
            <div key={index}>
              {part.type === 'columns' ? (
                <GnoColumns content={part.content} />
              ) : (
                <div className="prose-sm">
                  <RadixMarkdown>
                    {part.content}
                  </RadixMarkdown>
                </div>
              )}
            </div>
          ))}
        </Flex>
      </Flex>
    </Card>
  );
};

export default ContributorRealmHome;