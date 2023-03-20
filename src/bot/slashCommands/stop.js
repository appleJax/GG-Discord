import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { tryCatch } from "Utils";
import { Colors } from "Bot/utils";
import updateLeaderboard from "Bot/updateLeaderboard";
import { Quiz } from "Models";

export default {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription(
      "Stop the current quiz (only works when quiz is in progress)"
    ),
  async execute(interaction) {
    const { channel, client } = interaction;
    const roomId = channel.id;
    const activeQuiz = client.quizzes.get(roomId);

    if (!activeQuiz) {
      return interaction.reply({
        content: "There are no currently active quizzes",
        ephemeral: true,
      });
    }

    if (
      activeQuiz.survivalMode ||
      (activeQuiz.solo && activeQuiz.solo.id !== interaction.member.id)
    ) {
      return interaction.reply({
        content: "Sorry, the stop command is not allowed in this scenario",
        ephemeral: true,
      });
    }

    clearTimeout(activeQuiz.questionTimeout);
    clearTimeout(activeQuiz.nextQuestion);
    const stopMsg = new EmbedBuilder()
      .setColor(Colors.RED)
      .setDescription("Stopping quiz... 😢");

    await interaction.reply({ embeds: [stopMsg] });

    if (activeQuiz.points.length > 0) {
      await tryCatch(updateLeaderboard(channel));
    }

    client.quizzes.set(roomId, null);
    Quiz.deleteOne({ roomId }).exec().catch(console.error);
  },
};
