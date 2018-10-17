export default {
  name: 'start',
  description: 'Start a new quiz',
  execute(msg, args) {
    msg.channel.send('Starting quiz...');
  },
};
