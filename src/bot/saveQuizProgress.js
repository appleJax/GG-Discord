import { tryCatch } from 'Utils';
import { isPatron } from 'Bot/utils';
import { Deck, User } from 'Models';
import DECKS from 'Config/decks';

async function saveQuizProgress(msg, activeQuiz) {
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

  if (!isPatron(msg.member)) {
    return;
  }

  const deckName = DECKS[msg.channel.id];

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
          $set: { subScores },
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
    const { cardsAnsweredCorrectly } = deckUser;
    if (!cardsAnsweredCorrectly.includes(cardId)) {
      cardsAnsweredCorrectly.push(cardId);
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
              correctAnswers: 1,
              cardsAnsweredCorrectly: [cardId],
              survivalRecord: 0,
            },
          },
        },
      ).exec(),
    );
  }
}

export default saveQuizProgress;
