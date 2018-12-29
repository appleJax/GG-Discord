import { Card } from 'Models';
import { formatNumber, tryCatch } from 'Utils';
import { percentage, RankCalculator } from 'Bot/utils';

export default async function createDeckStatsBox(deck) {
  const rankCalculator = RankCalculator();
  const deckCards = await tryCatch(
    Card.count({ deck: deck.name }).exec(),
  );

  let deckStats = '';
  let deckUsers = deck.users.sort(
    (a, b) => b.uniqueCardsCorrect.length - a.uniqueCardsCorrect.length,
  );

  deckStats += `\n${'```asciidoc'}\n= ${deck.name} =`;
  deckStats += '\n\nTotal Cards Correct:';
  deckStats += `\n(everyone: ${formatNumber(deck.correctAnswers)})`;

  for (const user of deckUsers) {
    const rank = rankCalculator.rank(user.correctAnswers);
    deckStats += `\n${rank}. ${user.username}: ${formatNumber(user.correctAnswers)}`;
  }

  deckUsers = deck.users.sort((a, b) => b.correctAnswers - a.correctAnswers);

  if (deckUsers.length > 0) {
    deckStats += `\n\nUnique Cards Correct (out of ${formatNumber(deckCards)}):`;
  }

  rankCalculator.reset();
  for (const user of deckUsers) {
    const rank = rankCalculator.rank(user.uniqueCardsCorrect.length);
    deckStats += `\n${rank}. ${user.username}: ${formatNumber(user.uniqueCardsCorrect.length)} ${percentage(user.uniqueCardsCorrect.length, deckCards, user.deckLaps)} ${'🏆'.repeat(user.deckLaps)}`;
  }

  if (deck.survivalRecord > 0) {
    deckStats += '\n\nSurvival Record:';
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
    deckStats += `\n${rank}. ${user.username}: ${formatNumber(user.survivalRecord)}`;
  }

  deckStats += '```';

  return deckStats;
}
