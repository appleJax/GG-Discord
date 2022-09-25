import Discord from 'discord.js';
import { Colors } from 'Bot/utils';
import { tryCatch } from 'Utils';
import { Quiz } from 'Models';

export default async function notifyError(client) {
  const activeQuizzes = await tryCatch(
    Quiz.find().select('roomId').lean().exec(),
  );

  let room;
  let errorMsg;

  activeQuizzes.forEach(({ roomId }) => {
    room = client.channels.cache.get(roomId);
    errorMsg = new Discord.RichEmbed()
      .setColor(Colors.RED)
      .setDescription('Sorry, there was a connection error with Discord. You may need to re-enter your answer.');

    room.send(errorMsg);
  });
}
