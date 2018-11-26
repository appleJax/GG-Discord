import DECKS from 'Config/decks';
import { User } from 'Models';
import { tryCatch } from 'Utils';
import formatUserStats from 'Bot/formatUserStats';

export default async function updateLeaderboard(msg) {
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
  let rank = 1;

  for (const user of users) {
    nextUser += `\n${rank++}. ${user.username}`;
    nextUser += await tryCatch(
      formatUserStats(user, roomCache),
    );
    nextUser += '\n';

    if (stats.length + nextUser.length > 1950) {
      messageChunks.push(stats);
      stats = nextUser;
    } else {
      stats += nextUser;
    }
    nextUser = '';
  }

  messageChunks.push(stats);

  const leaderboard = msg.guild.channels.get(DECKS.leaderboard);
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
