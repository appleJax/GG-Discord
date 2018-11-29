import { tryCatch } from 'Utils';
/* eslint-disable-next-line */
import client from './config';
import rehydrateActiveQuizzes from './rehydrateActiveQuizzes';

const { BOT_TOKEN } = process.env;

client.on('ready', async () => {
  await tryCatch(
    rehydrateActiveQuizzes(client),
  );
  console.log('Discord Bot: LIVE');
});

client.on('error', (err) => {
  console.error(err);
  console.error(err.stack);
});

client.on('message', client.handleMsg);

export default ({
  start: () => client.login(BOT_TOKEN),
});
