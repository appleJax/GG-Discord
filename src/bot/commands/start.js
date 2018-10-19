import Discord from 'discord.js';
import { Colors } from '../utils';

export default {
  name: 'start',
  aliases: ['s'],
  description: 'Start a new quiz',
  usage: '[quiz-name]',
  execute(msg, args) {
    const self = this;
    let timeout = setTimeout(() => {
      timeout = null;
      self.activeQuiz = null;
    }, 8000);

    this.activeQuiz = {
      answer: 'gg',
      timeout,
    };

    const startMsg = new Discord.RichEmbed()
      .setColor(Colors.BLUE)
      .addField('Starting quiz...', '*Question #1:* What is my name?');

    msg.channel.send(startMsg);
  },
};
