/* eslint-disable prefer-template */

import DECKS from 'Config/decks';
import { Deck, User } from 'Models';
import { tryCatch } from 'Utils';
import createDeckStatsBox from './createDeckStatsBox';
import createOverallStatsBox from './createOverallStatsBox';
import deleteOldLeaderboard from './deleteOldLeaderboard';
import postNewLeaderboard from './postNewLeaderboard';

export default async function updateLeaderboard(channel) {
  let users = await tryCatch(
    User
      .find()
      .sort({ correctAnswers: 'desc' })
      .exec(),
  );

  if (!users || users.length === 0) {
    return;
  }

  const everyone = users.find(user => user.username === 'everyone');
  users = users.filter(user => user.username !== 'everyone');

  let stats = await tryCatch(
    createOverallStatsBox(everyone, users),
  );

  const decks = await tryCatch(
    Deck.find()
      .sort({ name: 'asc' })
      .lean()
      .exec(),
  );

  for (const deck of decks) {
    stats += await tryCatch(
      createDeckStatsBox(deck),
    );
  }

  const leaderboard = channel.client.channels.get(DECKS.leaderboard);

  await tryCatch(
    deleteOldLeaderboard(leaderboard),
  );

  await tryCatch(
    postNewLeaderboard(leaderboard, stats),
  );
}
