import Discord from 'discord.js';
import Models from 'Models';
import { tryCatch } from 'Utils';

const { Card, Room } = Models;

export const PACE_DELAY = 12000;
export const PREFIX = 'gg!';
export const TEST_ROOM = '441091794654986244';

export const Colors = {
  BLUE: '#1DA1F2',
  GOLD: '#F9A602',
  GREEN: '#008140',
  PURPLE: '#6A33EA',
  RED: '#CA0401',
};

export const DECKS = {
  '504554082984525854': 'TwitterBot',
  '505262797572276254': 'DBJG',
  '448017333907095562': 'DIJG',
  someId: 'iKnow Core 2000',
  [TEST_ROOM]: 'DBJG',
};

export async function askNextQuestion(client, channel) {
  const activeQuiz = client.quizzes.get(channel.id);

  activeQuiz.currentQuestion = activeQuiz.questions.pop();
  /* eslint-disable-next-line */
  activeQuiz.questionPosition[0]++;

  const { currentQuestion } = activeQuiz;
  const [currentPosition, totalQuestions] = activeQuiz.questionPosition;
  const position = `${currentPosition}/${totalQuestions}`;

  const nextMessage = new Discord.RichEmbed()
    .setColor(Colors.BLUE)
    .addField(`Next Question (${position}):`, activeQuiz.currentQuestion.questionText);

  let questionImages = [];
  if (currentQuestion.mediaUrls) {
    questionImages = currentQuestion.mediaUrls.slice(0, currentQuestion.mainImageSlice[1]);
  }

  setTimeout(() => {
    channel.send(nextMessage);

    questionImages.forEach((image) => {
      sendImage(channel, image);
    });

    activeQuiz.questionTimeout = setTimeout(
      () => client.nextQuestion(channel),
      activeQuiz.secondsPerQuestion,
    );
  }, PACE_DELAY);

  if (activeQuiz.survivalMode) {
    if (activeQuiz.questions.length < 5) {
      const deckQuery = {
        deck: DECKS[channel.id],
      };

      const newCards = await tryCatch(
        fetchCards(deckQuery, 10),
      );
      activeQuiz.questions = activeQuiz.questions.concat(newCards);
    }
  }
}

export function commandNotFound(command) {
  let notFound = `sorry, I don't understand that command: \`${command}\`\n`;
  notFound += `Use \`${PREFIX}help\` to see a list of all my commands.`;
  return notFound;
}

export function endQuiz(channel, activeQuiz) {
  const { highScore, survivalMode } = activeQuiz;
  const currentScore = activeQuiz.questionPosition[0] - 1;
  const endMsg = new Discord.RichEmbed();

  if (survivalMode && currentScore > highScore) {
    endMsg
      .setColor(Colors.PURPLE)
      .setDescription(`🏆 Congratulations, you set a new record for this quiz with ${currentScore} correct answers in a row, beating the previous record of ${highScore}!`);

    setHighScore(channel.id, currentScore);
  } else if (survivalMode && currentScore === highScore) {
    endMsg
      .setColor(Colors.GREEN)
      .setDescription(`Congratulations, you tied the current record of ${currentScore} correct answers in a row!`);
  } else if (survivalMode) {
    endMsg
      .setColor(Colors.BLUE)
      .setDescription(`That's it, thanks for playing! Type \`${PREFIX}survival\` to play again.`);
  } else {
    endMsg
      .setColor(Colors.BLUE)
      .setDescription(`That's it, thanks for playing! Type \`${PREFIX}start\` to play again.`);
  }

  setTimeout(
    () => channel.send(endMsg),
    2000,
  );
}

export function fetchCards(deckQuery, quizSize) {
  return Card.aggregate([
    { $match: deckQuery },
    { $sample: { size: quizSize } },
  ]);
}

export function fetchHighScore(roomId) {
  return Room
    .findOne({ roomId })
    .then(room => room.highScore);
}

export function parseInput(msg) {
  const args = msg.content.substr(PREFIX.length).split(/\s+/);
  const command = args.shift().toLowerCase();
  return [command, args];
}

export function sendImage(channel, image) {
  const message = new Discord.RichEmbed()
    .setColor(Colors.BLUE)
    .setImage(image.image)
    .setDescription(image.altText || '');

  channel.send(message);
}

export function shouldIgnore(msg) {
  return !msg.content.toLowerCase().startsWith(PREFIX) || msg.author.bot;
}

// private

function setHighScore(roomId, highScore) {
  Room.updateOne(
    { roomId },
    { $set: { highScore } },
  ).catch(console.error);
}
