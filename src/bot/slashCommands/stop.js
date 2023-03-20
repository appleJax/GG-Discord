import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { tryCatch } from "Utils";
import { Colors, sendWithRetry } from "Bot/utils";
import { Quiz } from "Models";
import updateLeaderboard from "./updateLeaderboard";

export default {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription(
      "Stop the current quiz (only works when quiz is in progress)"
    ),
  async execute(interaction) {
    if (
      activeQuiz.survivalMode ||
      (activeQuiz.solo && activeQuiz.solo.id !== interaction.member.id)
    ) {
      interaction.reply({
        content: "Sorry, the stop command is not allowed in this scenario",
        ephemeral: true,
      });
      return;
    }

    interaction.deferReply();

    const { channel, client } = interaction;
    const roomId = channel.id;
    const activeQuiz = client.quizzes.get(roomId);

    clearTimeout(activeQuiz.questionTimeout);
    clearTimeout(activeQuiz.nextQuestion);
    const stopMsg = new EmbedBuilder()
      .setColor(Colors.RED)
      .setDescription("Stopping quiz... 😢");

    sendWithRetry(channel, stopMsg);

    if (activeQuiz.points.length > 0) {
      await tryCatch(updateLeaderboard(channel));
    }

    client.quizzes.set(roomId, null);
    Quiz.deleteOne({ roomId }).exec().catch(console.error);
  },
};
