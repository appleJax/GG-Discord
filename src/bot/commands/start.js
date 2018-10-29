import Discord from 'discord.js';
import Models from 'Models';
import { tryCatch } from 'Utils';
import {
  Colors, DECKS, sendImage,
} from '../utils';

const { Card } = Models;
const QUIZ_SIZE = 10;
const TIME_PER_QUESTION = 60000;

const usage = '[quizSize] - number of questions (defaults to 10, max is 30)'
  + '\n[timePerQuestion] timeout for each question (in seconds - defaults to 70, max is 180)';

function validateArgs([size, time]) {
  let quizSize = size;
  let timePerQuestion = time;
  let error;

  if (timePerQuestion == null) {
    timePerQuestion = TIME_PER_QUESTION;
  } else {
    timePerQuestion = Math.round(Number(timePerQuestion));

    if (Number.isNaN(timePerQuestion) || timePerQuestion < 10 || timePerQuestion > 180) {
      error = `("${time}"). \`timePerQuestion\` must be between 10 and 180.`;
    }
  }

  if (quizSize == null) {
    quizSize = QUIZ_SIZE;
  } else {
    quizSize = Math.round(Number(quizSize));

    if (Number.isNaN(quizSize) || quizSize < 1 || quizSize > 30) {
      error = `("${size}"). \`quizSize\` must be between 1 and 30.`;
    }
  }

  return {
    quizSize,
    timePerQuestion,
    error,
  };
}

export default {
  name: 'start',
  aliases: ['s'],
  description: 'Start a new quiz',
  usageShort: '[quizSize] [timePerQuestion]',
  usage,
  async execute(msg, args) {
    const self = this;
    const roomId = msg.channel.id;

    const argsResult = validateArgs(args);

    if (argsResult.error) {
      msg.reply(`you passed an invalid argument ${argsResult.error}`);
      return;
    }

    const deckQuery = {
      deck: DECKS[roomId],
    };

    /* eslint-disable-next-line */
    const questions = await tryCatch(
      newQuiz(deckQuery, argsResult.quizSize),
    );

    if (!questions || questions.length === 0) {
      const errorMsg = new Discord.RichEmbed()
        .setColor(Colors.RED)
        .setDescription('Sorry, something went wrong');

      msg.channel.send(errorMsg);
      return;
    }

    const currentQuestion = questions.pop();

    const activeQuiz = {
      currentQuestion,
      questions,
      timePerQuestion: argsResult.timePerQuestion,
      questionPosition: [1, argsResult.quizSize],
    };

    const startMsg = new Discord.RichEmbed()
      .setColor(Colors.BLUE)
      .addField(`Starting quiz, first question (1/${argsResult.quizSize}):`, currentQuestion.questionText);

    msg.channel.send(startMsg);

    if (currentQuestion.mediaUrls) {
      const questionImages = currentQuestion.mediaUrls.slice(0, currentQuestion.mainImageSlice[1]);

      questionImages.forEach((image) => {
        sendImage(msg.channel, image);
      });
    }

    activeQuiz.questionTimeout = setTimeout(
      () => self.nextQuestion(msg.channel),
      activeQuiz.timePerQuestion,
    );
    this.quizzes.set(roomId, activeQuiz);
  },
};

function newQuiz(deckQuery, quizSize) {
  return Card.aggregate([
    { $match: deckQuery },
    { $sample: { size: quizSize } },
  ]);
}
