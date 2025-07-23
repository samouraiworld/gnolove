import { getContributors, getRepositories } from '@/app/actions';
import { TimeFilter } from '@/utils/github';
import { TEnhancedUserWithStatsAndScore } from '@/utils/schemas';
import { getContributorsWithScore } from '@/utils/score';
import { NextResponse } from 'next/server';

function formatLeaderboardMessage(contributors: TEnhancedUserWithStatsAndScore[]) {
  if (contributors.length === 0) {
    return 'No contributions found in the last week! 😢';
  }

  let message = '🏆 **Weekly Contributor Leaderboard** 🏆\n\n';

  // Emojis for podium positions
  const podiumEmojis = ['🥇', '🥈', '🥉'];

  for (let i = 0; i < contributors.length; i++) {
    // Use podium emoji if available, otherwise use position number
    let position = '';
    if (i < podiumEmojis.length) {
      position = podiumEmojis[i];
    } else {
      position = `${i + 1}.`;
    }

    // Use name if available, otherwise use login
    const displayName = contributors[i].name || contributors[i].login;

    // Format the contributor's stats
    message += `${position} **${displayName}** - **${contributors[i].score}** points\n`;
    message += `   💻 ${contributors[i].TotalCommits} commits • 🔀 ${contributors[i].TotalPrs} PRs • 🐛 ${contributors[i].TotalIssues} issues\n\n`;
  }

  message += '\nKeep up the great work! 🚀';
  return message;
}

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const repositories = await getRepositories();
  const contributors = await getContributors(TimeFilter.WEEKLY, false, repositories.map((repo) => repo.id));
  const contributorsWithScore = getContributorsWithScore(contributors).sort((a, b) => b.score - a.score).slice(0, 10);

  const content = formatLeaderboardMessage(contributorsWithScore);

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json({ error: 'Discord webhook URL not configured' }, { status: 500 });
  }

  const payload = {
    content,
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error }, { status: response.status });
  }

  return NextResponse.json({ success: true });
}
