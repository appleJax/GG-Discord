import Discord from 'discord.js';
import { sendWithRetry } from 'Bot/utils';
import { PREFIX, Colors, commandNotFound } from '../utils';

export default {
  name: 'help',
  aliases: ['h'],
  description: 'List all of my commands or info about a specific command',
  usage: '[commandName]',
  execute(msg, args) {
    const helpMessage = new Discord.RichEmbed()
      .setColor(Colors.BLUE)
      .setAuthor('GG', msg.client.user.avatarURL);

    if (!args.length) {
      let commandList = '';
      msg.client.commands.forEach((command) => {
        commandList += `\`${PREFIX}${command.name} ${command.usageShort || command.usage || ''}\`\n`;
      });

      /* eslint-disable-next-line */
      helpMessage.addField(`Here's a list of all my commands:`, commandList);

      helpMessage.addField('\u200B',
        `ℹ️ You can use \`${PREFIX}help [command name]\` to get info on a specific command!`);
    } else {
      const targetCommand = args[0].toLowerCase();
      const { commands } = msg.client;
      const command = commands.get(targetCommand)
        || commands.find(cmd => cmd.aliases && cmd.aliases.includes(targetCommand));

      if (!command) {
        return msg.reply(commandNotFound(targetCommand));
      }

      let description = `**Command:** \`${targetCommand}\`\n`;
      if (command.aliases) description += `**Aliases:** \`${command.aliases.join('`, `')}\`\n`;
      if (command.description) description += `**Description:** ${command.description}\n`;
      if (command.usage) description += `**Usage:** \`${PREFIX}${targetCommand} ${command.usageShort ? `${command.usageShort}\n` : ''}${command.usage}\``;

      helpMessage.setDescription(description);
    }

    return sendWithRetry(msg.channel, helpMessage);
  },
};
