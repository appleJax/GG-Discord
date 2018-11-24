import { Card, Room } from 'Models';
import { tryCatch } from 'Utils';

export default async function formatUserStats(user, roomCache = new Map()) {
  let stats = `\n  Total correct answers: ${user.correctAnswers}`;

  let room;
  let subScore;
  let totalCards;

  for (const roomId of user.subScores) {
    if (roomCache.has(roomId)) {
      room = roomCache.get(roomId);
    } else {
      room = await tryCatch(
        Room.findOne({ roomId }).exec(),
      );

      totalCards = await tryCatch(
        Card.count({ deck: room.deck }).exec(),
      );

      room.totalCards = totalCards;
      roomCache.set(roomId, room);
    }

    subScore = room.users.find(record => record.userId === user.userId);
    if (subScore) {
      stats += `\n  ${room.deck}:`;
      stats += `\n    Correct answers: ${subScore.correctAnswers}`;
      stats += deckPercentageCorrect(subScore, room.totalCards);
      stats += `\n    Survival record: ${subScore.survivalRecord}`;
    }
  }

  return stats;
}

// private
function deckPercentageCorrect(subScore, totalCards) {
  const cardCounts = `${subScore.cardsAnsweredCorrectly.length}/${totalCards}`;
  const cardPercentage = Math.round(
    (subScore.cardsAnsweredCorrectly.length / totalCards) * 100,
  );
  return `\n    Unique cards correct:  ${cardCounts} (${cardPercentage}%)`;
}
