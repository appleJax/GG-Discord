import Discord from 'discord.js';
import { User } from 'Models';
import { Colors } from 'Bot/utils';
import { tryCatch } from 'Utils';

export default {
  name: 'stats',
  aliases: [],
  description: 'Display the top scoring users',
  usage: '(only works when quiz is NOT in progress)',
  async execute(msg) {
    const topUsers = await tryCatch(
      User
        .find()
        .sort({ correctAnswers: 'desc' })
        .limit(10)
        .exec(),
    );

    let topUsersList = '';
    topUsers.forEach((user) => {
      topUsersList += `\n${user.username}: ${user.correctAnswers}`;
    });

    const topUsersMsg = new Discord.RichEmbed()
      .setColor(Colors.BLUE)
      .addField('Top Scores (Total Correct Answers):', topUsersList);

    msg.channel.send(topUsersMsg);
  },
};
