'use strict'

const constants = require('../constants');

const helpDescription = {
  embed: {
    title: 'GG Quiz',
    description: 'Say **gg!quiz start** to start a quiz.',
    color: constants.EMBED_NEUTRAL_COLOR,
    footer: {
      text: 'You can set a score limit by using the `]settings` command'
    }
  }
};

module.exports = {
  commandAliases: ['gg!quiz'],
  uniqueId: 'quiz37392',
  cooldown: 1,
  shortDescription: 'Start a quiz for this channel.',
  // longDescription: longHelpDescription,
  action(bot, msg, suffix) {
    if (suffix === 'help') {
      return msg.channel.createMessage(helpDescription);
    }
    console.log('Room ID type', typeof msg.channel.id)
    console.log('User ID type', typeof msg.author.id)

    return msg.channel.createMessage(msg.channel.id + ' ' + msg.author.id);
  },
};
