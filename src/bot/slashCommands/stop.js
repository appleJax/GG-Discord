import { SlashCommandBuilder } from "discord.js";
import { tryCatch } from "Utils";

export default {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription(
      "Stop the current quiz (only works when quiz is in progress)"
    ),
  async execute(interaction) {},
};
