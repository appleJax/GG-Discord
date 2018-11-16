import Discord from 'discord.js';
import { Card, Room } from 'Models';
import { tryCatch } from 'Utils';
import DECKS from 'Config/decks';

export const PACE_DELAY = 12000;
export const PREFIX = 'gg!';

export const Colors = {
  BLUE: '#1DA1F2',
  GOLD: '#F9A602',
  GREEN: '#008140',
  PURPLE: '#633193',
  RED: '#CA0401',
};

export async function askNextQuestion(client, channel) {
  const activeQuiz = client.quizzes.get(channel.id);
  const { questionPosition, highScore } = activeQuiz;

  if (highScore && questionPosition[0] === highScore) {
    const s = highScore === 1 ? '' : 's';
    const tiedHighScore = new Discord.RichEmbed()
      .setColor(Colors.GREEN)
      .setDescription(`👔 You are now TIED with the previous record of ${highScore} correct answer${s} in a row!`);

    channel.send(tiedHighScore);
  }

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
        fetchCards(deckQuery, 200),
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

export function endQuiz(channel, activeQuiz = {}) {
  const { highScore, survivalMode } = activeQuiz;
  const currentScore = activeQuiz.questionPosition[0] - 1;
  const endMsg = new Discord.RichEmbed();

  const playAgain = command => `\n\nType \`${PREFIX}${command}\` to play again.`;
  const s = currentScore === 1 ? '' : 's';

  if (survivalMode && currentScore > highScore) {
    endMsg
      .setColor(Colors.PURPLE)
      .setDescription(`🏆 Congratulations, you set a new record for this quiz with ${currentScore} correct answer${s} in a row, beating the previous record of ${highScore}!${playAgain('survival')}`);

    setHighScore(channel.id, currentScore);
  } else if (survivalMode && currentScore === highScore) {
    endMsg
      .setColor(Colors.GREEN)
      .setDescription(`Congratulations, you tied the current record of ${currentScore} correct answer${s} in a row!${playAgain('survival')}`);
  } else if (survivalMode) {
    endMsg
      .setColor(Colors.BLUE)
      .setDescription(`Thanks for playing, you correctly answered ${currentScore} question${s} in a row! Current record: ${highScore}${playAgain('survival')}`);
  } else {
    endMsg
      .setColor(Colors.BLUE)
      .setDescription(`That's it, thanks for playing!${playAgain('start')}`);
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
    .then(room => (room && room.highScore) || 0);
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
