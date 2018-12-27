import { Deck } from 'Models';
import { tryCatch } from 'Utils';

export default async function aggregateUniqueCardsCorrect(users) {
  const userAggregate = [];
  const deckCache = new Map();

  for (const user of users) {
    let uniqueCardsCorrect = 0;
    let deck;
    let subScore;

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
        deckCache.set(deckName, deck);
      }
      subScore = deck.users.find(record => record.userId === user.userId);
      uniqueCardsCorrect += subScore.uniqueCardsCorrect.length;
    }

    userAggregate.push({
      username: user.username,
      uniqueCardsCorrect,
    });
  }

  userAggregate.sort((a, b) => b.uniqueCardsCorrect - a.uniqueCardsCorrect);

  return userAggregate;
}
