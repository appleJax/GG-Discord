import { REST, Routes } from "discord.js";
import fs from "node:fs";

const commands = [];

const commandFiles = fs.readdirSync("src/bot/slashCommands");

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
  const command = require(`../src/bot/slashCommands/${file}`).default;
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );
    console.log("NODE_ENV:", process.env.NODE_ENV);

    const endpoint =
      process.env.NODE_ENV === "production"
        ? Routes.applicationCommands(process.env.BOT_ID)
        : Routes.applicationGuildCommands(
            process.env.BOT_ID,
            process.env.GUILD_ID
          );

    const data = await rest.put(endpoint, { body: commands });

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
})();
