import { tryCatch } from 'Utils';

export default async function postNewLeaderboard(leaderboard, stats) {
  const messageChunks = [];

  while (stats.length > 1950) {
    messageChunks.push(`${stats.slice(0, 1950)}${'```'}`);
    stats = `${'```'}${stats.slice(1950)}`;
  }

  messageChunks.push(stats);

  for (const chunk of messageChunks) {
    await tryCatch(
      leaderboard.send(chunk),
    );
  }
}
