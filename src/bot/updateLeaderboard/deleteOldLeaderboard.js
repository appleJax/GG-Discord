import { tryCatch } from 'Utils';

export default async function deleteOldLeaderboard(leaderboard) {
  const oldMessages = await tryCatch(
    leaderboard.fetchMessages(),
  );

  if (oldMessages.size) {
    await tryCatch(
      leaderboard.bulkDelete(oldMessages.size),
    );
  }
}
