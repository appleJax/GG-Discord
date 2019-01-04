import { tryCatch } from 'Utils';
import client from 'Bot/config';
import handleMessage from 'Bot/handleMessage';
import notifyError from 'Bot/notifyError';
import rehydrateActiveQuizzes from 'Bot/rehydrateActiveQuizzes';

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

client.on('message', handleMessage);

export default ({
  start: () => client.login(BOT_TOKEN),
});
