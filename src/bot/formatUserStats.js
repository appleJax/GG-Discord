import { Card, Deck } from 'Models';
import { tryCatch } from 'Utils';
import { deckPercentageCorrect } from 'Bot/utils';

async function formatUserStats(user, deckCache = new Map()) {
  let stats = `\n    Overall Cards Correct: ${user.correctAnswers}`;

  let deck;
  let subScore;
  let totalCards;

  user.subScores.sort();

  for (const deckName of user.subScores) {
    if (deckCache.has(deckName)) {
      deck = deckCache.get(deckName);
    } else {
      deck = await tryCatch(
        Deck.findOne({ name: deckName }).lean().exec(),
      );

      if (!deck) {
        continue;
      }

      totalCards = await tryCatch(
        Card.count({ deck: deckName }).exec(),
      );

      deck.totalCards = totalCards;
      deckCache.set(deckName, deck);
    }

    subScore = deck.users.find(record => record.userId === user.userId);
    if (subScore) {
      stats += `\n    ${deck.name}:`;
      stats += `\n        Total Cards Correct: ${subScore.correctAnswers}`;
      stats += `\n        Unique Cards Correct: ${deckPercentageCorrect(subScore.uniqueCardsCorrect.length, deck.totalCards)}`;
      stats += `\n        Survival Record: ${subScore.survivalRecord}`;
    }
  }

  return stats;
}

export default formatUserStats;
