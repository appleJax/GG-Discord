import { SlashCommandBuilder } from "discord.js";
import { User } from "Models";
import { tryCatch } from "Utils";
import formatUserStats from "Bot/formatUserStats";

export default {
  data: new SlashCommandBuilder()
    .setName("me")
    .setDescription("Check your current stats (only works for Patrons)"),
  async execute(interaction) {
    await interaction.deferReply();
    const user = await tryCatch(
      User.findOne({ userId: interaction.user.id }).lean().exec()
    );

    if (!user) {
      return interaction.editReply(
        "You have not yet answered any questions correctly."
      );
    }

    const userStats = await tryCatch(formatUserStats(user));

    return interaction.editReply({
      content: `Your stats:\n${userStats}`,
      ephemeral: true,
    });
  },
};
