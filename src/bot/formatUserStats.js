import { Card, Room } from 'Models';
import { tryCatch } from 'Utils';
import DECKS from 'Config/decks';

const cache = new Map();

async function formatUserStats(user, roomCache = cache) {
  let stats = `\n    Total correct answers: ${user.correctAnswers}`;

  let room;
  let subScore;
  let totalCards;

  for (const roomId of user.subScores) {
    if (roomCache.has(roomId)) {
      room = roomCache.get(roomId);
    } else {
      room = await tryCatch(
        Room.findOne({ roomId }).lean().exec(),
      );

      if (!room) {
        /* eslint-disable-next-line */
        continue;
      }

      totalCards = await tryCatch(
        Card.count({ deck: room.deck }).exec(),
      );

      room.totalCards = totalCards;
      roomCache.set(roomId, room);
    }

    subScore = room.users.find(record => record.userId === user.userId);
    if (subScore) {
      const solo = (DECKS.soloSurvival.includes(roomId))
        ? '(Solo Survival) '
        : '';

      stats += `\n    ${solo}${room.deck}:`;
      stats += `\n        Correct answers: ${subScore.correctAnswers}`;
      stats += deckPercentageCorrect(subScore, room.totalCards);
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
