import { Card, Deck } from 'Models';
import { tryCatch } from 'Utils';

const cache = new Map();

async function formatUserStats(user, deckCache = cache) {
  let stats = `\n    Total correct answers: ${user.correctAnswers}`;

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
        /* eslint-disable-next-line */
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
      stats += `\n        Correct answers: ${subScore.correctAnswers}`;
      stats += deckPercentageCorrect(subScore, deck.totalCards);
      stats += `\n        Survival record: ${subScore.survivalRecord}`;
    }
  }

  return stats;
}

export default formatUserStats;

// private
function deckPercentageCorrect(subScore, totalCards) {
  const cardCounts = `${subScore.cardsAnsweredCorrectly.length}/${totalCards}`;
  const cardPercentage = Math.round(
    (subScore.cardsAnsweredCorrectly.length / totalCards) * 100,
  );
  return `\n        Unique cards correct:  ${cardCounts} (${cardPercentage}%)`;
}