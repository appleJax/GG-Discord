import { tryCatch } from 'Utils';
import {
  Card,
  Deck,
  User,
} from 'Models';

export default async function notifyGlobalPercentMilestone(msg, userId) {
  const totalCards = await tryCatch(
    Card.count().exec(),
  );

  const user = await tryCatch(
    User.findOne({ userId }).lean().exec(),
  );

  let uniqueCardsCorrect = 0;
  let deck;
  let subScore;

  for (const deckName of user.subScores) {
    deck = await tryCatch(
      Deck.findOne({ name: deckName }).lean().exec(),
    );

    if (!deck) {
      continue;
    }

    subScore = deck.users.find(record => record.userId === userId);

    let deckCards = subScore.uniqueCardsCorrect.length;

    if (subScore.deckLaps > 0) {
      deckCards = await tryCatch(
        Card.count({ deck: deckName }).exec(),
      );
    }

    uniqueCardsCorrect += deckCards;
  }

  const currentPercentage = uniqueCardsCorrect / totalCards;

  if (currentPercentage > user.nextPercentMilestone) {
    msg.reply(`congratulations! You just completed ${user.nextPercentMilestone * 100}% of all cards in the database!`);

    await tryCatch(
      User.updateOne(
        { userId },
        { $inc: { nextPercentMilestone: 0.1 } },
      ).exec().catch(console.error),
    );
  }
}
