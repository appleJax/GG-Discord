'use strict'

module.exports = {
  commandAliases: ['gg!about'],
  uniqueId: 'about53463',
  cooldown: 5,
  shortDescription: 'Show some meta information about me.',
  action(bot, msg, suffix) {
    return msg.channel.createMessage(`\`\`\`md
Hello! I'm GG, the official GameGogakuen QuizBot!
\`\`\``);
  },
};
