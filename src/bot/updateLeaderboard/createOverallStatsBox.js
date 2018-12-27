import { Card } from 'Models';
import { formatNumber, tryCatch } from 'Utils';
import { percentage, RankCalculator } from 'Bot/utils';
import aggregateUniqueCardsCorrect from './aggregateUniqueCardsCorrect';

export default async function createOverallStatsBox(everyone, users) {
  const rankCalculator = RankCalculator();

  const totalCards = await tryCatch(
    Card.count().exec(),
  );

  const globalSortedUniqueCardsCorrect = await tryCatch(
    aggregateUniqueCardsCorrect(users),
  );

  let overallStats = '```asciidoc\n= Overall =';

  overallStats += '\n\nTotal Cards Correct:';
  overallStats += `\n(everyone: ${formatNumber(everyone.correctAnswers)})`;

  for (const user of users) {
    const rank = rankCalculator.rank(user.correctAnswers);
    overallStats += `\n${rank}. ${user.username}: ${formatNumber(user.correctAnswers)}`;
  }

  if (globalSortedUniqueCardsCorrect.length > 0) {
    overallStats += `\n\nUnique Cards Correct (out of ${formatNumber(totalCards)}):`;
  }

  rankCalculator.reset();
  for (const user of globalSortedUniqueCardsCorrect) {
    const rank = rankCalculator.rank(user.uniqueCardsCorrect);
    overallStats += `\n${rank}. ${user.username}: ${formatNumber(user.uniqueCardsCorrect)} ${percentage(user.uniqueCardsCorrect, totalCards)}`;
  }

  overallStats += '```';

  return overallStats;
}
