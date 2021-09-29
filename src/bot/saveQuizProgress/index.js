import { tryCatch } from "Utils";
import { Card, Deck, Quiz, User } from "Models";
import DECKS from "Config/decks";
import notifyGlobalPercentMilestone from "./notifyGlobalPercentMilestone";

export default async function saveQuizProgress(msg, activeQuiz) {
  const roomId = msg.channel.id;
  const deckName = DECKS[roomId];
  const { id: userId, username } = msg.author;
  const userIndex = activeQuiz.points.findIndex(
    (stat) => stat.userId === userId
  );

  // TODO - abstract updateActiveQuiz
  if (userIndex >= 0) {
    activeQuiz.points[userIndex].correctAnswers += 1;
  } else {
    activeQuiz.points.push({
      userId,
      username,
      correctAnswers: 1,
    });
  }

  await tryCatch(
    Quiz.updateOne({ roomId }, { $set: { points: activeQuiz.points } }).exec()
  );

  // TODO - abstract incrementGlobalCorrectAnswers
  await tryCatch(
    User.updateOne({ username: "everyone" }, { $inc: { correctAnswers: 1 } })
  );

  await tryCatch(
    Deck.updateOne({ name: deckName }, { $inc: { correctAnswers: 1 } })
  );

  // TODO - abstract updateOrCreateUser
  const user = await tryCatch(User.findOne({ userId }).lean().exec());
  const userTag = `${msg.author.username}#${msg.author.discriminator}`;

  if (user) {
    const { subScores } = user;
    if (!subScores.includes(deckName)) {
      subScores.push(deckName);
    }

    await tryCatch(
      User.updateOne(
        { userId },
        {
          $inc: { correctAnswers: 1 },
          $set: {
            subScores,
            username: msg.author.username,
            tag: userTag,
          },
        }
      ).exec()
    );
  } else {
    await tryCatch(
      User.create({
        userId,
        username: msg.author.username,
        tag: userTag,
        correctAnswers: 1,
        nextPercentMilestone: 0.25,
        subScores: [deckName],
      })
    );
  }

  // TODO - abstract updateOrCreateDeck
  const { cardId } = activeQuiz.currentQuestion;

  let deck = await tryCatch(
    Deck.findOne({ name: deckName }, { _id: 0 }).lean().exec()
  );

  if (!deck) {
    deck = {
      name: deckName,
      correctAnswers: 1,
      survivalRecord: 0,
      users: [],
    };
  }

  const deckUser = deck.users.find((obj) => obj.userId === userId);

  if (deckUser) {
    deckUser.correctAnswers += 1;
    const { uniqueCardsCorrect } = deckUser;

    const totalCards = await tryCatch(Card.count({ deck: deckName }).exec());

    if (uniqueCardsCorrect.length === totalCards) {
      deckUser.deckLaps = (deckUser.deckLaps || 0) + 1;
      deckUser.uniqueCardsCorrect = [cardId];
      msg.reply(
        `congratulations! 🏆 You just completed ${
          deckUser.deckLaps * 100
        }% of this deck!`
      );
      deckUser.nextPercentMilestone += 0.25;
    } else if (!uniqueCardsCorrect.includes(cardId)) {
      uniqueCardsCorrect.push(cardId);

      const percentCorrect =
        deckUser.deckLaps + uniqueCardsCorrect.length / totalCards;
      if (percentCorrect >= deckUser.nextPercentMilestone) {
        msg.reply(
          `congratulations! 🏅 You just completed ${
            deckUser.nextPercentMilestone * 100
          }% of this deck!`
        );
        deckUser.nextPercentMilestone += 0.25;
      }
    }
  } else {
    deck.users.push({
      userId,
      username,
      correctAnswers: 1,
      uniqueCardsCorrect: [cardId],
      deckLaps: 0,
      nextPercentMilestone: 0.25,
      survivalRecord: 0,
    });
  }

  await tryCatch(
    Deck.replaceOne({ name: deckName }, deck, { overwrite: true, upsert: true })
  );

  await tryCatch(notifyGlobalPercentMilestone(msg, userId));
}
