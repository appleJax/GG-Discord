/* eslint-disable prefer-template */

import DECKS from 'Config/decks';
import { Card, Deck, User } from 'Models';
import { formatNumber, tryCatch } from 'Utils';
import { percentage, RankCalculator } from 'Bot/utils';
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


  const rankCalculator = RankCalculator();

  const decks = await tryCatch(
    Deck.find()
      .sort({ name: 'asc' })
      .lean()
      .exec(),
  );

  let deckUsers;
  let deckCards;

  // TODO - abstract createDeckStatsBox(deck);
  for (const deck of decks) {
    // TODO - abstract calculateCorrectAnswers
    deckUsers = deck.users.sort(
      (a, b) => b.uniqueCardsCorrect.length - a.uniqueCardsCorrect.length,
    );

    deckCards = await tryCatch(
      Card.count({ deck: deck.name }).exec(),
    );

    stats += `\n${'```asciidoc'}\n= ${deck.name} =`;
    stats += '\n\nTotal Cards Correct:';
    stats += `\n(everyone: ${formatNumber(deck.correctAnswers)})`;

    rankCalculator.reset();
    for (const user of deckUsers) {
      const rank = rankCalculator.rank(user.correctAnswers);
      stats += `\n${rank}. ${user.username}: ${formatNumber(user.correctAnswers)}`;
    }

    // TODO - abstract calculateUniqueCardsCorrect
    deckUsers = deck.users.sort((a, b) => b.correctAnswers - a.correctAnswers);

    if (deckUsers.length > 0) {
      stats += `\n\nUnique Cards Correct (out of ${formatNumber(deckCards)}):`;
    }

    rankCalculator.reset();
    for (const user of deckUsers) {
      const rank = rankCalculator.rank(user.uniqueCardsCorrect.length);
      stats += `\n${rank}. ${user.username}: ${formatNumber(user.uniqueCardsCorrect.length)} ${percentage(user.uniqueCardsCorrect.length, deckCards, user.deckLaps)} ${'🏆'.repeat(user.deckLaps)}`;
    }

    // TODO - abstract calculateSurvivalRecord
    if (deck.survivalRecord > 0) {
      stats += '\n\nSurvival Record:';
      deckUsers = deck.users.concat({
        username: 'everyone',
        survivalRecord: deck.survivalRecord,
      });
    }

    deckUsers = deckUsers
      .filter(u => u.survivalRecord > 0)
      .sort((a, b) => b.survivalRecord - a.survivalRecord);

    rankCalculator.reset();
    for (const user of deckUsers) {
      const rank = rankCalculator.rank(user.survivalRecord);
      stats += `\n${rank}. ${user.username}: ${formatNumber(user.survivalRecord)}`;
    }

    stats += '```';
  }

  const leaderboard = channel.client.channels.get(DECKS.leaderboard);

  await tryCatch(
    deleteOldLeaderboard(leaderboard),
  );

  await tryCatch(
    postNewLeaderboard(leaderboard, stats),
  );
}
