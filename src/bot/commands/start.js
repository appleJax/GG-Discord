import { EmbedBuilder } from "discord.js";
import { tryCatch } from "Utils";
import DECKS from "Config/decks";
import { Quiz } from "Models";
import handleQuestionTimeout from "Bot/handleQuestionTimeout";
import {
  END_DELAY,
  PACE_DELAY,
  TURBO_DELAY,
  TURBO,
  Colors,
  fetchCards,
  sendImage,
  sendWithRetry,
} from "Bot/utils";

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

const usage =
  `[quizSize] - number of questions (defaults to ${QUIZ_SIZE.default}, max is ${QUIZ_SIZE.max})` +
  `\n[secondsPerQuestion] - timeout for each question (in seconds - defaults to ${SECONDS_PER_QUESTION.default}, max is ${SECONDS_PER_QUESTION.max})` +
  `\n["${TURBO}"] - removes the 10-second answer review period between questions`;

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

      if (
        Number.isNaN(paramValue) ||
        paramValue < values.min ||
        paramValue > values.max
      ) {
        argsResult.error = `("${param}"). \`${name}\` must be between ${values.min} and ${values.max}.`;
      }
    }
  };

  validate(seconds, "secondsPerQuestion", SECONDS_PER_QUESTION);
  validate(size, "quizSize", QUIZ_SIZE);

  return argsResult;
}

export default {
  name: "start",
  aliases: ["s"],
  description: "Start a new quiz",
  usageShort: `[quizSize] [secondsPerQuestion] ["${TURBO}"]`,
  usage,
  async execute(msg, args) {
    const { channel } = msg;
    const { client } = channel;
    const roomId = channel.id;
    const soloRooms = DECKS.soloSurvival;

    if (soloRooms.includes(roomId)) {
      msg.reply(
        "this is a solo survival room. You can use `gg!start` in any of the Public Quiz Arcade channels."
      );
      return;
    }

    let endDelay = END_DELAY;
    let paceDelay = PACE_DELAY;
    const turboIndex = args.findIndex(
      (arg) => String(arg).toLowerCase() === TURBO
    );
    if (turboIndex >= 0) {
      endDelay = TURBO_DELAY;
      paceDelay = TURBO_DELAY;
      args.splice(turboIndex, 1);
    }

    const argsResult = validateArgs(args);
    console.log("Args result:", argsResult);

    if (argsResult.error) {
      msg.reply(`you passed an invalid argument ${argsResult.error}`);
      return;
    }

    const deckQuery = {
      deck: DECKS[roomId],
    };

    const questions = await tryCatch(
      fetchCards(deckQuery, argsResult.quizSize)
    );

    if (!questions || questions.length === 0) {
      const errorMsg = new EmbedBuilder()
        .setColor(Colors.RED)
        .setDescription("Sorry, something went wrong");

      sendWithRetry(channel, errorMsg);
      return;
    }

    const currentQuestion = questions.pop();

    const activeQuiz = {
      currentQuestion,
      endDelay,
      hardMode: false,
      isFinished: false,
      paceDelay,
      points: [],
      questions,
      questionPosition: [1, argsResult.quizSize],
      secondsPerQuestion: argsResult.secondsPerQuestion,
    };

    const startMsg = new EmbedBuilder().setColor(Colors.BLUE).addFields([
      {
        name: `Starting quiz, first question (1/${argsResult.quizSize}):`,
        value: currentQuestion.questionText,
      },
    ]);

    await tryCatch(sendWithRetry(channel, startMsg));

    if (currentQuestion.mediaUrls) {
      const questionImages = currentQuestion.mediaUrls.slice(
        0,
        currentQuestion.mainImageSlice[1]
      );

      questionImages.forEach((image) => {
        sendImage(channel, image, activeQuiz);
      });
    }

    const timeoutRef = setTimeout(
      () => handleQuestionTimeout(channel),
      activeQuiz.secondsPerQuestion * 1000
    );

    client.quizzes.set(roomId, {
      ...activeQuiz,
      questionTimeout: timeoutRef,
    });

    const timeoutMs = Date.now() + activeQuiz.secondsPerQuestion * 1000;

    await tryCatch(
      Quiz.create({
        ...activeQuiz,
        roomId,
        currentQuestion: activeQuiz.currentQuestion._id,
        questions: activeQuiz.questions.map((obj) => obj._id),
        timer: {
          name: "questionTimeout",
          time: timeoutMs,
        },
      })
    );
    console.log("Quiz created");
  },
};
