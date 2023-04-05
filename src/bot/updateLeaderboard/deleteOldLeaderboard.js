import { tryCatch } from "Utils";

export default async function deleteOldLeaderboard(leaderboard) {
  const oldMessages = await tryCatch(leaderboard.messages.fetch());

  if (oldMessages.size) {
    await Promise.all(oldMessages.each((msg) => msg.delete()));
  }
}
