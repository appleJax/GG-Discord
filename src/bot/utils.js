import Discord from 'discord.js';

export const PACE_DELAY = 12000;
export const PREFIX = 'gg!';
export const TEST_ROOM = '441091794654986244';

export const Colors = {
  BLUE: '#1DA1F2',
  GOLD: '#F9A602',
  GREEN: '#008140',
  RED: '#CA0401',
};

export const DECKS = {
  '504554082984525854': 'TwitterBot',
  '505262797572276254': 'DBJG',
  '448017333907095562': 'DIJG',
  someId: 'iKnow Core 2000',
  [TEST_ROOM]: 'DBJG',
};

export function askNextQuestion(client, channel) {
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
      activeQuiz.timePerQuestion,
    );
  }, PACE_DELAY);
}

export function commandNotFound(command) {
  let notFound = `sorry, I don't understand that command: \`${command}\`\n`;
  notFound += `Use \`${PREFIX}help\` to see a list of all my commands.`;
  return notFound;
}

export function endQuiz(channel) {
  const quizHasEnded = new Discord.RichEmbed()
    .setColor(Colors.BLUE)
    .setDescription(`That's it, thanks for playing! Type \`${PREFIX}start\` to play again.`);

  setTimeout(
    () => channel.send(quizHasEnded),
    2000,
  );
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
