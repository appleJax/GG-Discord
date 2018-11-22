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
  const { questionPosition, survivalRecord } = activeQuiz;

  if (survivalRecord && questionPosition[0] === survivalRecord) {
    const s = survivalRecord === 1 ? '' : 's';
    const tiedSurvivalRecord = new Discord.RichEmbed()
      .setColor(Colors.GREEN)
      .setDescription(`👔 You are now TIED with the previous record of ${survivalRecord} correct answer${s} in a row!`);

    channel.send(tiedSurvivalRecord);
  }
  const onDeckQuestion = activeQuiz.questions.pop();
  activeQuiz.currentQuestion = { answers: [] };
  /* eslint-disable-next-line */
  activeQuiz.questionPosition[0]++;

  const [currentPosition, totalQuestions] = activeQuiz.questionPosition;
  const position = `${currentPosition}/${totalQuestions}`;

  const nextMessage = new Discord.RichEmbed()
    .setColor(Colors.BLUE)
    .addField(`Next Question (${position}):`, onDeckQuestion.questionText);

  let questionImages = [];
  if (onDeckQuestion.mediaUrls) {
    questionImages = onDeckQuestion.mediaUrls.slice(0, onDeckQuestion.mainImageSlice[1]);
  }

  activeQuiz.nextQuestion = setTimeout(() => {
    channel.send(nextMessage);

    activeQuiz.currentQuestion = onDeckQuestion;

    questionImages.forEach((image) => {
      sendImage(channel, image);
    });

    activeQuiz.questionTimeout = setTimeout(
      () => client.nextQuestion(channel),
      activeQuiz.secondsPerQuestion * 1000,
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
  let userCommand = '.';
  if (command) {
    userCommand = `: \`${command}\``;
  }
  let notFound = `sorry, I don't understand that command${userCommand}\n`;
  notFound += `Use \`${PREFIX}help\` to see a list of all my commands.`;
  return notFound;
}

export function endQuiz(channel, activeQuiz = {}) {
  const { survivalRecord, survivalMode, points } = activeQuiz;
  const currentScore = activeQuiz.questionPosition[0] - 1;
  const endMsg = new Discord.RichEmbed();

  let pointsMsg = '';

  if (points.length > 0) {
    const userPoints = points
      .sort((a, b) => b.correctAnswers - a.correctAnswers)
      .map(user => `${user.username}: ${user.correctAnswers}`)
      .join('\n');

    pointsMsg = `\n\nCorrect Answers:\n${userPoints}`;
  }

  const playAgain = command => `\n\nType \`${PREFIX}${command}\` to play again.`;
  const summary = command => `${pointsMsg}${playAgain(command)}`;
  const s = currentScore === 1 ? '' : 's';

  if (survivalMode && currentScore > survivalRecord) {
    endMsg
      .setColor(Colors.PURPLE)
      .setDescription(`🏆 Congratulations, you set a new record for this quiz with ${currentScore} correct answer${s} in a row, beating the previous record of ${survivalRecord}!${summary('survival')}`);

    setSurvivalRecord(channel.id, currentScore);
  } else if (survivalMode && currentScore === survivalRecord) {
    endMsg
      .setColor(Colors.GREEN)
      .setDescription(`Congratulations, you tied the current record of ${currentScore} correct answer${s} in a row!${summary('survival')}`);
  } else if (survivalMode) {
    endMsg
      .setColor(Colors.BLUE)
      .setDescription(`Thanks for playing, you correctly answered ${currentScore} question${s} in a row!\nCurrent record: ${survivalRecord}${summary('survival')}`);
  } else {
    endMsg
      .setColor(Colors.BLUE)
      .setDescription(`That's it, thanks for playing!${summary('start')}`);
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

export function fetchSurvivalRecord(roomId) {
  return Room
    .findOne({ roomId })
    .then(room => (room && room.survivalRecord) || 0);
}

export function parseInput(msg) {
  const args = msg.content.substr(PREFIX.length).trim().split(/\s+/);
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

function setSurvivalRecord(roomId, survivalRecord) {
  Room.updateOne(
    { roomId },
    { $set: { survivalRecord } },
  ).catch(console.error);
}
