import { Card, Room, User } from 'Models';
import { tryCatch } from 'Utils';

const PATREON_LINK = 'https://www.patreon.com/gamegogakuen';

export default {
  name: 'me',
  aliases: [],
  description: 'Check your current stats',
  usage: '(only works when quiz is NOT in progress)',
  async execute(msg) {
    const becomeAPatron = `you must be a Patron to use this feature. ${PATREON_LINK}`;
    const user = await tryCatch(
      User.findOne({ userId: msg.author.id }).exec(),
    );

    if (!user) {
      return msg.reply(becomeAPatron);
    }

    let stats = 'your stats:';
    stats += `\nTotal correct answers: ${user.correctAnswers}`;

    let totalCards;
    let room;
    let subScore;
    for (const roomId of user.subScores) {
      room = await tryCatch(
        Room.findOne({ roomId }).exec(),
      );
      totalCards = await tryCatch(
        Card.count({ deck: room.deck }).exec(),
      );
      subScore = room.users.find(record => record.userId === user.userId);
      if (subScore) {
        stats += `\n${room.deck}:`;
        stats += `\n    Correct answers: ${subScore.correctAnswers}`;
        stats += deckPercentageCorrect(subScore, totalCards);
        stats += `\n    Survival record: ${subScore.survivalRecord}`;
      }
    }
    return msg.reply(stats);
  },
};

// private
function deckPercentageCorrect(subScore, totalCards) {
  const cardCounts = `${subScore.cardsAnsweredCorrectly.length}/${totalCards}`;
  const cardPercentage = Math.round(
    (subScore.cardsAnsweredCorrectly.length / totalCards) * 100,
  );
  return `\n    Unique cards correct:  ${cardCounts} (${cardPercentage}%)`;
}
