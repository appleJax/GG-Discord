import fs from "node:fs";
import path from "node:path";
import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import handleMessage from "Bot/handleMessage";
import notifyError from "Bot/notifyError";
import rehydrateActiveQuizzes from "Bot/rehydrateActiveQuizzes";
import { tryCatch } from "Utils";

const { BOT_TOKEN } = process.env;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
client.commands = new Collection();
client.slashCommands = new Collection();
client.cooldowns = new Collection();
client.quizzes = new Collection();

const commandFiles = fs.readdirSync(path.resolve(__dirname, "commands"));

const slashCommandFiles = fs.readdirSync(
  path.resolve(__dirname, "slashCommands")
);

export default async function initBot() {
  for (const file of commandFiles) {
    const command = await import(`./commands/${file}`).then(
      (_module) => _module.default
    );
    client.commands.set(command.name, command);
    client.cooldowns.set(command.name, new Collection());
  }

  for (const file of slashCommandFiles) {
    const command = await import(`./slashCommands/${file}`).then(
      (_module) => _module.default
    );
    client.slashCommands.set(command.data.name, command);
  }

  client.once(Events.ClientReady, async () => {
    await tryCatch(rehydrateActiveQuizzes(client));
    console.log("Discord Bot: LIVE");
  });

  client.on(Events.Error, (err) => {
    notifyError(client);
    console.error(err);
    console.error(err.stack);
  });

  client.on(Events.MessageCreate, handleMessage);

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  });

  return {
    start: () => client.login(BOT_TOKEN),
  };
}
