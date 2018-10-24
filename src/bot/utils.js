import Discord from 'discord.js';

export const PACE_DELAY = 10000;
export const PREFIX = 'gg!';
export const TIME_PER_QUESTION = 45000;

export const Colors = {
  BLUE: '#1DA1F2',
  GREEN: '#008140',
  RED: '#CA0401',
  GOLD: '#F9A602',
};

export function askNextQuestion(client, channel) {
  const { activeQuiz } = client;

  activeQuiz.currentQuestion = activeQuiz.questions.pop();
  /* eslint-disable-next-line */
  activeQuiz.questionPosition[0]++;

  const { currentQuestion } = activeQuiz;
  const [currentPosition, totalQuestions] = activeQuiz.questionPosition;
  const position = `${currentPosition}/${totalQuestions}`;

  const nextMessage = new Discord.RichEmbed()
    .setColor(Colors.BLUE)
    .addField(`Next Question (${position}):`, activeQuiz.currentQuestion.questionText);

  const questionImages = currentQuestion.mediaUrls.slice(0, currentQuestion.mainImageSlice[1]);

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
    PACE_DELAY,
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
  return !msg.content.startsWith(PREFIX) || msg.author.bot;
}
