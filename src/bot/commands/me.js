import { User } from 'Models';
import { tryCatch } from 'Utils';
import { isPatron } from 'Bot/utils';
import formatUserStats from 'Bot/formatUserStats';

const PATREON_LINK = 'https://www.patreon.com/gamegogakuen';

export default {
  name: 'me',
  aliases: [],
  description: 'Check your current stats',
  usage: '(only works for Patrons)',
  async execute(msg) {
    const becomeAPatron = `you must be a Patron to use this feature. ${PATREON_LINK}`;

    if (!isPatron(msg.member)) {
      return msg.reply(becomeAPatron);
    }

    const user = await tryCatch(
      User.findOne({ userId: msg.author.id }).lean().exec(),
    );

    if (!user) {
      return msg.reply('you have not answered any questions correctly. Try `gg!start` in one of the Quiz Arcade channels!');
    }

    const userStats = await tryCatch(
      formatUserStats(user),
    );

    return msg.reply(`your stats:\n${userStats}`);
  },
};
