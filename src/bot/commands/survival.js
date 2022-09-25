import { EmbedBuilder } from "discord.js";
import { tryCatch } from "Utils";
import { Quiz } from "Models";
import DECKS from "Config/decks";
import handleQuestionTimeout from "Bot/handleQuestionTimeout";
import {
  END_DELAY,
  PACE_DELAY,
  TURBO_DELAY,
  TURBO,
  HARDMODE,
  Colors,
  fetchCards,
  fetchSurvivalRecord,
  sendImage,
  sendWithRetry,
} from "Bot/utils";

const SECONDS_PER_QUESTION = 60;
const usage =
  `["${TURBO}"] - removes the 10-second answer review period between questions` +
  `\n["${HARDMODE}"] - first wrong answer will end quiz`;

export default {
  name: "survival",
  description: `This quiz serves questions continuously until one expires without being answered correctly. You have ${SECONDS_PER_QUESTION} seconds to answer each question.`,
  usageShort: `["${TURBO}"] ["${HARDMODE}"]`,
  usage,
  async execute(msg, args) {
    const { channel } = msg;
    const { client } = channel;
    const roomId = channel.id;
    const deckName = DECKS[roomId];

    const deckQuery = {
      deck: deckName,
    };

    let solo = null;
    if (DECKS.soloSurvival.includes(roomId)) {
      solo = {
        id: msg.author.id,
        username: msg.author.username,
      };
    }

    const survivalRecord = await tryCatch(fetchSurvivalRecord(deckName));

    const questions = await tryCatch(fetchCards(deckQuery, 10));

    if (!questions || questions.length === 0) {
      const errorMsg = new EmbedBuilder()
        .setColor(Colors.RED)
        .setDescription("Sorry, something went wrong");

      sendWithRetry(channel, errorMsg);
      return;
    }

    const currentQuestion = questions.pop();

    let endDelay = END_DELAY;
    let paceDelay = PACE_DELAY;
    if (String(args[0]).toLowerCase() === TURBO) {
      endDelay = TURBO_DELAY;
      paceDelay = TURBO_DELAY;
    }

    let hardMode = false;
    const hardModeIndex = args.findIndex(
      (arg) => String(arg).toLowerCase() === HARDMODE
    );
    if (hardModeIndex >= 0) {
      hardMode = true;
      args.splice(hardModeIndex, 1);
    }

    const activeQuiz = {
      currentQuestion,
      endDelay,
      hardMode,
      incorrectAnswers: [],
      isFinished: false,
      paceDelay,
      points: [],
      questions,
      questionPosition: [1, "??"],
      rebukes: [],
      secondsPerQuestion: SECONDS_PER_QUESTION,
      solo,
      survivalRecord,
      survivalMode: true,
    };

    const startMsg = new EmbedBuilder().setColor(Colors.BLUE).addFields([
      {
        name: `Starting quiz, see how long you can survive! Current record: ${survivalRecord} correct answers`,
        value: currentQuestion.questionText,
      },
    ]);

    sendWithRetry(channel, startMsg);

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
  },
};
