import { tryCatch } from 'Utils';
import { isPatron } from 'Bot/utils';
import {
  Card,
  Deck,
  Quiz,
  User,
} from 'Models';
import DECKS from 'Config/decks';

async function saveQuizProgress(msg, activeQuiz) {
  const roomId = msg.channel.id;
  const deckName = DECKS[roomId];
  const { id: userId, username } = msg.author;
  const userIndex = activeQuiz.points.findIndex(stat => stat.userId === userId);

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
    Quiz.updateOne(
      { roomId },
      { $set: { points: activeQuiz.points } },
    ).exec(),
  );

  await tryCatch(
    User.updateOne(
      { username: 'everyone' },
      { $inc: { correctAnswers: 1 } },
    ),
  );

  await tryCatch(
    Deck.updateOne(
      { name: deckName },
      { $inc: { correctAnswers: 1 } },
    ),
  );

  if (!isPatron(msg.member)) {
    return;
  }

  const user = await tryCatch(
    User.findOne({ userId }).lean().exec(),
  );

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
            tag: msg.member.user.tag,
          },
        },
      ).exec(),
    );
  } else {
    await tryCatch(
      User.create({
        userId,
        username: msg.author.username,
        tag: msg.member.user.tag,
        correctAnswers: 1,
        subScores: [deckName],
      }),
    );
  }

  const { cardId } = activeQuiz.currentQuestion;

  let deck = await tryCatch(
    Deck.findOne({ name: deckName }).lean().exec(),
  );

  if (!deck) {
    deck = {
      name: deckName,
      survivalRecord: 0,
      users: [],
    };

    await tryCatch(
      Deck.create(deck),
    );
  }

  const deckUser = deck.users.find(obj => obj.userId === userId);

  if (deckUser) {
    deckUser.correctAnswers += 1;
    const { uniqueCardsCorrect } = deckUser;

    const totalCards = await tryCatch(
      Card.count({ deck: deckName }).exec(),
    );

    if (uniqueCardsCorrect.length === totalCards) {
      deckUser.deckLaps = (deckUser.deckLaps || 0) + 1;
      deckUser.uniqueCardsCorrect = [cardId];
    } else if (!uniqueCardsCorrect.includes(cardId)) {
      uniqueCardsCorrect.push(cardId);
    }

    await tryCatch(
      Deck.updateOne(
        { name: deckName },
        { $set: { users: deck.users } },
      ).exec(),
    );
  } else {
    await tryCatch(
      Deck.updateOne(
        { name: deckName },
        {
          $push: {
            users: {
              userId,
              username,
              correctAnswers: 1,
              uniqueCardsCorrect: [cardId],
              deckLaps: 0,
              survivalRecord: 0,
            },
          },
        },
      ).exec(),
    );
  }
}

export default saveQuizProgress;
