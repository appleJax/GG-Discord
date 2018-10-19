import Discord from 'discord.js';
import { PREFIX, Colors } from './utils';

const STOP_COMMAND = `${PREFIX}stop`;

export default (client) => {
  client.handleQuizResponse = (msg) => {
    const response = msg.content.toLowerCase();
    const { answer, timeout } = client.activeQuiz;

    if (response.startsWith(STOP_COMMAND)) {
      clearTimeout(timeout);
      client.activeQuiz = null;

      const stopMsg = new Discord.RichEmbed()
        .setColor(Colors.RED)
        .setDescription('Stopping quiz... 😢');

      msg.channel.send(stopMsg);
      return;
    }

    if (response === answer) {
      const congrats = new Discord.RichEmbed()
        .setColor(Colors.GREEN)
        .addField(`CORRECT: ${answer}`, `@${msg.author.username} answered correctly!`);

      msg.channel.send(congrats);
    }
  };
};
