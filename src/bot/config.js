import fs from 'fs';
import path from 'path';
import Discord from 'discord.js';
import attachMessageHandler from './messageHandler'
import attachQuizResponseHandler from './quizResponseHandler'

const client = new Discord.Client();
client.commands = new Discord.Collection();
client.cooldowns = new Discord.Collection();

const commandFiles = fs.readdirSync(path.resolve(__dirname, 'commands'));

async function loadCommands() {
  for (const file of commandFiles) {
    /* eslint-disable-next-line */
    const command = await import(`./commands/${file}`).then(_module => _module.default);

    client.commands.set(command.name, command);
    client.cooldowns.set(command.name, new Discord.Collection());
  }
}

attachQuizResponseHandler(client);
attachMessageHandler(client);
loadCommands();

export default client;
