import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { tryCatch } from "Utils";
import DECKS from "Config/decks";
import { Quiz } from "Models";
import handleQuestionTimeout from "Bot/handleQuestionTimeout";
import {
  END_DELAY,
  PACE_DELAY,
  TURBO_DELAY,
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

export default {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription(`Start a new quiz`)
    .addIntegerOption((option) =>
      option
        .setName("quiz_size")
        .setDescription("The number of questions in the quiz")
        .setMinValue(QUIZ_SIZE.min)
        .setMaxValue(QUIZ_SIZE.max)
    )
    .addIntegerOption((option) =>
      option
        .setName("seconds_per_question")
        .setDescription("The timeout for each question, in seconds")
        .setMinValue(SECONDS_PER_QUESTION.min)
        .setMaxValue(SECONDS_PER_QUESTION.max)
    )
    .addBooleanOption((option) =>
      option
        .setName("turbo_mode")
        .setDescription(
          "Removes the 10-second answer-review period between questions"
        )
    ),

  async execute(interaction) {
    const { channel, client } = interaction;
    const roomId = channel.id;
    const soloRooms = DECKS.soloSurvival;

    if (soloRooms.includes(roomId)) {
      interaction.reply(
        "this is a solo survival room. You can use `/start` in any of the Public Quiz Arcade channels."
      );
      return;
    }

    let endDelay = END_DELAY;
    let paceDelay = PACE_DELAY;

    if (interaction.options.getBoolean("turbo_mode")) {
      endDelay = TURBO_DELAY;
      paceDelay = TURBO_DELAY;
    }

    const deckQuery = {
      deck: DECKS[roomId],
    };

    const quizSize =
      interaction.options.getInteger("quiz_size") || QUIZ_SIZE.default;

    const questions = await tryCatch(fetchCards(deckQuery, quizSize));

    if (!questions || questions.length === 0) {
      const errorMsg = new EmbedBuilder()
        .setColor(Colors.RED)
        .setDescription("Sorry, something went wrong");

      interaction.reply({ embeds: [errorMsg] });
      return;
    }

    const secondsPerQuestion =
      interaction.options.getInteger("seconds_per_question") ||
      SECONDS_PER_QUESTION.default;

    const currentQuestion = questions.pop();

    const activeQuiz = {
      currentQuestion,
      endDelay,
      hardMode: false,
      isFinished: false,
      paceDelay,
      points: [],
      questions,
      questionPosition: [1, quizSize],
      secondsPerQuestion: secondsPerQuestion,
    };

    const startMsg = new EmbedBuilder().setColor(Colors.BLUE).addFields([
      {
        name: `Starting quiz, first question (1/${quizSize}):`,
        value: currentQuestion.questionText,
      },
    ]);

    await interaction.reply({ embeds: [startMsg] });

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
