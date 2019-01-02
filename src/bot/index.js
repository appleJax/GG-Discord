import { tryCatch } from 'Utils';
import client from './config';
import rehydrateActiveQuizzes from './rehydrateActiveQuizzes';
import notifyError from './notifyError';

const { BOT_TOKEN } = process.env;

client.on('ready', async () => {
  await tryCatch(
    rehydrateActiveQuizzes(client),
  );
  console.log('Discord Bot: LIVE');
});

client.on('error', (err) => {
  notifyError(client);
  console.error(err);
  console.error(err.stack);
});

client.on('message', client.handleMsg);

export default ({
  start: () => client.login(BOT_TOKEN),
});
