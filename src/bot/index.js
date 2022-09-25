import fs from "node:fs";
import path from "node:path";
import Discord from "discord.js";
import handleMessage from "Bot/handleMessage";
import notifyError from "Bot/notifyError";
import rehydrateActiveQuizzes from "Bot/rehydrateActiveQuizzes";
import { tryCatch } from "Utils";

const { BOT_TOKEN } = process.env;

const client = new Discord.Client();
client.commands = new Discord.Collection();
client.cooldowns = new Discord.Collection();
client.quizzes = new Discord.Collection();

const commandFiles = fs.readdirSync(path.resolve(__dirname, "commands"));

export default async function initBot() {
  for (const file of commandFiles) {
    const command = await import(`./commands/${file}`).then(
      (_module) => _module.default
    );
    client.commands.set(command.name, command);
    client.cooldowns.set(command.name, new Discord.Collection());
  }

  client.on("ready", async () => {
    await tryCatch(rehydrateActiveQuizzes(client));
    console.log("Discord Bot: LIVE");
  });

  client.on("error", (err) => {
    notifyError(client);
    console.error(err);
    console.error(err.stack);
  });

  client.on("message", handleMessage);

  return {
    start: () => client.login(BOT_TOKEN),
  };
}
