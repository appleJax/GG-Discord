/* eslint-disable-next-line */
import client from './config';

const { BOT_TOKEN } = process.env;

client.on('ready', () => console.log('Discord Bot: LIVE'));

client.on('error', err => console.error(err));

client.on('message', client.handleMsg);

export default ({
  start: () => client.login(BOT_TOKEN),
});
