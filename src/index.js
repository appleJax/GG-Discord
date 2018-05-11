import monochrome from 'monochrome-bot';

const {
  CONFIG_FILE_PATH,
  COMMANDS_PATH,
  MESSAGE_PROCESSORS_PATH,
  SETTINGS_PATH
} = process.env;

const bot = new monochrome(
  CONFIG_FILE_PATH,
  COMMANDS_PATH,
  MESSAGE_PROCESSORS_PATH,
  SETTINGS_PATH
);

bot.connect();