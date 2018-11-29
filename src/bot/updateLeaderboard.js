import DECKS from 'Config/decks';
import { User } from 'Models';
import { tryCatch } from 'Utils';
import formatUserStats from 'Bot/formatUserStats';

export default async function updateLeaderboard(channel) {
  const users = await tryCatch(
    User
      .find()
      .sort({ correctAnswers: 'desc' })
      .exec(),
  );

  const roomCache = new Map();
  const messageChunks = [];

  let stats = '**Top Scores:**\n';
  let nextUser = '';
  let currentScore = Infinity;
  let skip = 1;
  let rank = 0;

  for (const user of users) {
    if (user.correctAnswers < currentScore) {
      rank += skip;
      skip = 1;
      currentScore = user.correctAnswers;
    } else {
      skip++;
    }
    nextUser += `\n${rank}. ${user.username}`;
    nextUser += await tryCatch(
      formatUserStats(user, roomCache),
    );
    nextUser += '\n';

    if (stats.length + nextUser.length > 1900) {
      messageChunks.push(stats);
      stats = nextUser;
    } else {
      stats += nextUser;
    }
    nextUser = '';
  }

  messageChunks.push(stats);

  const leaderboard = channel.client.channels.get(DECKS.leaderboard);
  const oldMessages = await tryCatch(
    leaderboard.fetchMessages(),
  );

  if (oldMessages.size) {
    await tryCatch(
      leaderboard.bulkDelete(oldMessages.size),
    );
  }

  messageChunks.forEach(
    chunk => leaderboard.send(chunk),
  );
}
