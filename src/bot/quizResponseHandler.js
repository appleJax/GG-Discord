import Discord from 'discord.js';
import {
  PREFIX, Colors, endQuiz, sendImage, askNextQuestion,
} from './utils';

const STOP_COMMAND = `${PREFIX}stop`;

export default (client) => {
  client.nextQuestion = (channel) => {
    const { activeQuiz } = client;
    if (activeQuiz == null) {
      return;
    }

    clearTimeout(activeQuiz.questionTimeout);
    const { currentQuestion, questions } = activeQuiz;

    const revealAnswer = new Discord.RichEmbed()
      .setColor(Colors.GOLD)
      .addField("Time's up!", currentQuestion.answerText);

    channel.send(revealAnswer);

    const answerImages = currentQuestion.mediaUrls.slice(currentQuestion.mainImageSlice[1]);

    answerImages.forEach((imageUrl) => {
      sendImage(channel, imageUrl.image);
    });

    if (questions.length === 0) {
      client.activeQuiz = null;
      endQuiz(channel);
      return;
    }

    askNextQuestion(client, channel);
  };

  client.handleQuizResponse = (msg) => {
    const response = msg.content.toLowerCase();
    const { activeQuiz } = client;
    const { currentQuestion, questions } = activeQuiz;

    if (response.startsWith(STOP_COMMAND)) {
      clearTimeout(activeQuiz.questionTimeout);
      client.activeQuiz = null;

      const stopMsg = new Discord.RichEmbed()
        .setColor(Colors.RED)
        .setDescription('Stopping quiz... 😢');

      msg.channel.send(stopMsg);
      return;
    }

    if (!currentQuestion.answers.includes(response)) {
      return;
    }

    clearTimeout(activeQuiz.questionTimeout);

    const congrats = new Discord.RichEmbed()
      .setColor(Colors.GREEN)
      .addField(`@${msg.author.username} answered correctly!`, currentQuestion.answerText);

    msg.channel.send(congrats);

    if (questions.length === 0) {
      client.activeQuiz = null;
      endQuiz(msg.channel);
      return;
    }

    askNextQuestion(client, msg.channel);
  };
};
