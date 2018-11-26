import { tryCatch } from 'Utils';
import { isPatron } from 'Bot/utils';
import { Room, User } from 'Models';
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

  const roomId = msg.channel.id;

  const user = await tryCatch(
    User.findOne({ userId }).lean().exec(),
  );

  if (user) {
    const { subScores } = user;
    if (!subScores.includes(roomId)) {
      subScores.push(roomId);
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
        subScores: [roomId],
      }),
    );
  }

  const { cardId } = activeQuiz.currentQuestion;

  let room = await tryCatch(
    Room.findOne({ roomId }).lean().exec(),
  );

  if (!room) {
    room = {
      roomId,
      deck: DECKS[roomId],
      survivalRecord: 0,
      users: [],
    };

    await tryCatch(
      Room.create(room),
    );
  }

  const roomUser = room.users.find(obj => obj.userId === userId);
  if (roomUser) {
    roomUser.correctAnswers += 1;
    const { cardsAnsweredCorrectly } = roomUser;
    if (!cardsAnsweredCorrectly.includes(cardId)) {
      cardsAnsweredCorrectly.push(cardId);
    }

    await tryCatch(
      Room.updateOne(
        { roomId },
        { $set: { users: room.users } },
      ).exec(),
    );
  } else {
    await tryCatch(
      Room.updateOne(
        { roomId },
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
