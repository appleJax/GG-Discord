import { EmbedBuilder } from "discord.js";
import { PREFIX, Colors, commandNotFound, sendWithRetry } from "Bot/utils";

export default {
  name: "help",
  aliases: ["h"],
  description: "List all of my commands or info about a specific command",
  usage: "[command name]",
  execute(msg, args) {
    const helpMessage = new EmbedBuilder()
      .setColor(Colors.BLUE)
      .setAuthor({ name: "GG", iconURL: msg.client.user.avatarURL() });

    if (!args.length) {
      let commandList = "";
      msg.client.commands.forEach((command) => {
        commandList += `\`${PREFIX}${command.name} ${
          command.usageShort || command.usage || ""
        }\`\n`;
      });

      /* eslint-disable-next-line */
      helpMessage.addFields([
        { name: `Here's a list of all my commands:`, value: commandList },
        {
          name: "\u200B",
          value: `ℹ️ You can use \`${PREFIX}help [command name]\` to get info on a specific command.`,
        },
      ]);
    } else {
      const targetCommand = args[0].toLowerCase();
      const { commands } = msg.client;
      const command =
        commands.get(targetCommand) ||
        commands.find(
          (cmd) => cmd.aliases && cmd.aliases.includes(targetCommand)
        );

      if (!command) {
        return msg.reply(commandNotFound(targetCommand));
      }

      let description = `**Command:** \`${targetCommand}\`\n`;
      if (command.aliases && command.aliases.length)
        description += `**Aliases:** \`${command.aliases.join("`, `")}\`\n`;
      if (command.description)
        description += `**Description:** ${command.description}\n`;
      if (command.usage)
        description += `**Usage:** \`${PREFIX}${targetCommand} ${
          command.usageShort ? `${command.usageShort}\n` : ""
        }${command.usage}\``;

      helpMessage.setDescription(description);
    }

    return sendWithRetry(msg.channel, helpMessage);
  },
};
