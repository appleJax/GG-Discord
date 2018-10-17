import fs from 'fs';
import path from 'path';
import Discord from 'discord.js';
import { parseInput, shouldIgnore } from './utils';

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync(path.resolve(__dirname, 'commands'));

async function loadCommands() {
  for (const file of commandFiles) {
    /* eslint-disable-next-line */
    const command = await import(`./commands/${file}`).then(_module => _module.default);

    client.commands.set(command.name, command);
  }
}

loadCommands();

client.handleMsg = (msg) => {
  if (shouldIgnore(msg)) return;

  const [command, args] = parseInput(msg);
  // console.log('MSG:', msg);

  if (!client.commands.has(command)) {
    msg.reply(`Sorry, I didn't understand that command: ${command}`);
    return;
  }
  
  try {
    client.commands.get(command).execute(msg, args);
  } catch (err) {
    console.error(err);
    msg.reply('Sorry, something went wrong. Please try again.');
  }
};

export default client;
