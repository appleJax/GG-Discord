export default {
  name: 'stop',
  aliases: ['quit'],
  description: 'Stop the current quiz',
  usage: '(only works when quiz is in progress)',
  execute(msg) {
    msg.reply('the `stop` command works only when there is a quiz in progress.');
  },
};
