import DECKS from 'Config/decks';
import { tryCatch } from 'Utils';
import handleQuizResponse from 'Bot/handleQuizResponse';
import {
  PREFIX, commandNotFound, parseInput, shouldIgnore,
} from 'Bot/utils';

const quizRooms = Object.keys(DECKS);

export default async function handleMessage(msg) {
  const { channel } = msg;
  const { client } = channel;
  const roomId = channel.id;

  if (!quizRooms.includes(roomId)) {
    return;
  }

  if (client.quizzes.get(roomId)) {
    await tryCatch(
      handleQuizResponse(msg),
    );
    return;
  }

  if (shouldIgnore(msg)) return;

  const [commandName, args] = parseInput(msg);
  const command = client.commands.get(commandName)
    || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) {
    msg.reply(commandNotFound(commandName));
    return;
  }

  if (!command.directMsg && channel.type !== 'text') {
    msg.reply('I can\'t execute that command inside DMs!');
    return;
  }

  if (command.args && !args.length) {
    let helpMessage = 'that command requires arguments.';
    if (command.usage) {
      helpMessage += `\nThe proper usage would be: \`${PREFIX}${command.name} ${command.usage}\``;
    }
    msg.reply(helpMessage);
    return;
  }

  const now = Date.now();
  const timestamps = client.cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;

  if (timestamps.has(msg.author.id)) {
    const expirationTime = timestamps.get(msg.author.id) + cooldownAmount;

    if (now < expirationTime) {
      // const timeLeft = (expirationTime - now) / 1000;
      // msg.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
      return;
    }
  }

  timestamps.set(msg.author.id, now);
  setTimeout(() => timestamps.delete(msg.author.id), cooldownAmount);

  try {
    command.execute.call(client, msg, args);
  } catch (err) {
    console.error(err);
    msg.reply('sorry, something went wrong. Please try again.');
  }
}