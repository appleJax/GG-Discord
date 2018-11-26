import { Card, Deck } from 'Models';
import { tryCatch } from 'Utils';
import DECKS from 'Config/decks';

const cache = new Map();

async function formatUserStats(user, deckCache = cache) {
  let stats = `\n    Total correct answers: ${user.correctAnswers}`;

  let deck;
  let deckName;
  let subScore;
  let totalCards;

  for (const roomId of user.subScores) {
    deckName = DECKS[roomId];
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
        Card.count({ deck: deck.name }).exec(),
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
