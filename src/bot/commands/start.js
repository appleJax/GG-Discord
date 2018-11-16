import Discord from 'discord.js';
import { tryCatch } from 'Utils';
import DECKS from 'Config/decks';
import {
  Colors, fetchCards, sendImage,
} from '../utils';

// exported for testing
export const QUIZ_SIZE = {
  default: 10,
  min: 1,
  max: 30,
};

// exported for testing
export const TIME_PER_QUESTION = {
  default: 60,
  min: 10,
  max: 180,
};

const usage = `[quizSize] - number of questions (defaults to ${QUIZ_SIZE.default}, max is ${QUIZ_SIZE.max})`
  + `\n[secondsPerQuestion] timeout for each question (in seconds - defaults to ${TIME_PER_QUESTION.default}, max is ${TIME_PER_QUESTION.max})`;

// exported for testing
export function validateArgs([size, time]) {
  const argsResult = {};

  const validate = (param, name, values) => {
    let paramValue = param;
    if (paramValue == null) {
      argsResult[name] = values.default;
    } else {
      paramValue = Math.round(Number(param));
      argsResult[name] = paramValue;

      if (Number.isNaN(paramValue) || paramValue < values.min || paramValue > values.max) {
        argsResult.error = `("${param}"). \`${name}\` must be between ${values.min} and ${values.max}.`;
      }
    }
  };

  validate(time, 'secondsPerQuestion', TIME_PER_QUESTION);
  validate(size, 'quizSize', QUIZ_SIZE);

  argsResult.secondsPerQuestion *= 1000;

  return argsResult;
}

export default {
  name: 'start',
  aliases: ['s'],
  description: 'Start a new quiz',
  usageShort: '[quizSize] [secondsPerQuestion]',
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
      fetchCards(deckQuery, argsResult.quizSize),
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
      secondsPerQuestion: argsResult.secondsPerQuestion,
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
      activeQuiz.secondsPerQuestion,
    );
    this.quizzes.set(roomId, activeQuiz);
  },
};
