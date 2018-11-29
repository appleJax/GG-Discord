import Discord from 'discord.js';
import { tryCatch } from 'Utils';
import DECKS from 'Config/decks';
import { sendWithRetry } from 'Bot/utils';
import { Quiz } from 'Models';
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
export const SECONDS_PER_QUESTION = {
  default: 60,
  min: 10,
  max: 180,
};

const usage = `[quizSize] - number of questions (defaults to ${QUIZ_SIZE.default}, max is ${QUIZ_SIZE.max})`
  + `\n[secondsPerQuestion] timeout for each question (in seconds - defaults to ${SECONDS_PER_QUESTION.default}, max is ${SECONDS_PER_QUESTION.max})`;

// exported for testing
export function validateArgs([size, seconds]) {
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

  validate(seconds, 'secondsPerQuestion', SECONDS_PER_QUESTION);
  validate(size, 'quizSize', QUIZ_SIZE);

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
    const { channel } = msg;
    const roomId = channel.id;
    const soloRooms = DECKS.soloSurvival;

    if (soloRooms.includes(roomId)) {
      msg.reply('this is a solo survival room. You can use `gg!start` in any of the Public Quiz Arcade channels.');
      return;
    }

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

      sendWithRetry(channel, errorMsg);
      return;
    }

    const currentQuestion = questions.pop();

    const activeQuiz = {
      currentQuestion,
      points: [],
      questions,
      questionPosition: [1, argsResult.quizSize],
      secondsPerQuestion: argsResult.secondsPerQuestion,
    };

    const startMsg = new Discord.RichEmbed()
      .setColor(Colors.BLUE)
      .addField(`Starting quiz, first question (1/${argsResult.quizSize}):`, currentQuestion.questionText);

    sendWithRetry(channel, startMsg);

    if (currentQuestion.mediaUrls) {
      const questionImages = currentQuestion.mediaUrls.slice(0, currentQuestion.mainImageSlice[1]);

      questionImages.forEach((image) => {
        sendImage(channel, image);
      });
    }

    activeQuiz.questionTimeout = setTimeout(
      () => self.nextQuestion(channel),
      activeQuiz.secondsPerQuestion * 1000,
    );
    this.quizzes.set(roomId, activeQuiz);

    const questionTimeout = Date.now() + (activeQuiz.secondsPerQuestion * 1000);

    await tryCatch(
      Quiz.create({
        ...activeQuiz,
        roomId,
        currentQuestion: activeQuiz.currentQuestion._id,
        questions: activeQuiz.questions.map(obj => obj._id),
        timer: {
          name: 'questionTimeout',
          time: questionTimeout,
        },
      }),
    );
  },
};
