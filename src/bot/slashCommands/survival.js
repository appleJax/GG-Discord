import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { tryCatch } from "Utils";
import { Quiz } from "Models";
import DECKS from "Config/decks";
import handleQuestionTimeout from "Bot/handleQuestionTimeout";
import {
  END_DELAY,
  PACE_DELAY,
  TURBO_DELAY,
  Colors,
  fetchCards,
  fetchSurvivalRecord,
  sendImage,
} from "Bot/utils";

const SECONDS_PER_QUESTION = 60;

export default {
  data: new SlashCommandBuilder()
    .setName("survival")
    .setDescription(
      `Serves questions continuously until ${SECONDS_PER_QUESTION} seconds pass without a correct answer`
    )
    .addBooleanOption((option) =>
      option
        .setName("turbo_mode")
        .setDescription(
          "Removes the 10-second answer-review period between questions"
        )
    )
    .addBooleanOption((option) =>
      option
        .setName("hard_mode")
        .setDescription("First wrong answer will end quiz")
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const { channel, client, member } = interaction;
    const roomId = channel.id;
    const deckName = DECKS[roomId];

    const deckQuery = {
      deck: deckName,
    };

    let solo = null;
    if (DECKS.soloSurvival.includes(roomId)) {
      solo = {
        id: member.id,
        username: member.user.username,
      };
    }

    const survivalRecord = await tryCatch(fetchSurvivalRecord(deckName));

    const questions = await tryCatch(fetchCards(deckQuery, 10));

    if (!questions || questions.length === 0) {
      const errorMsg = new EmbedBuilder()
        .setColor(Colors.RED)
        .setDescription("Sorry, something went wrong");

      return interaction.editReply({ embeds: [errorMsg] });
    }

    const currentQuestion = questions.pop();

    let endDelay = END_DELAY;
    let paceDelay = PACE_DELAY;

    if (interaction.options.getBoolean("turbo_mode")) {
      endDelay = TURBO_DELAY;
      paceDelay = TURBO_DELAY;
    }

    const activeQuiz = {
      currentQuestion,
      endDelay,
      hardMode: interaction.options.getBoolean("hard_mode"),
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

    const startMsg = new EmbedBuilder()
      .setDescription("Start survival")
      .setColor(Colors.BLUE)
      .addFields([
        {
          name: `Starting quiz, see how long you can survive! Current record: ${survivalRecord} correct answers`,
          value: currentQuestion.questionText,
        },
      ]);

    await interaction.editReply({ embeds: [startMsg] });

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
