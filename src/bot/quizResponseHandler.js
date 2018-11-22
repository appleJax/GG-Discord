import Discord from 'discord.js';
import { tryCatch } from 'Utils';
import saveQuizProgress from './saveQuizProgress';
import {
  PREFIX, Colors, endQuiz, sendImage, askNextQuestion,
} from './utils';

const STOP_COMMAND = `${PREFIX}stop`;

export default (client) => {
  client.nextQuestion = (channel) => {
    const roomId = channel.id;
    const activeQuiz = client.quizzes.get(roomId);
    if (activeQuiz == null) {
      return;
    }

    clearTimeout(activeQuiz.questionTimeout);
    const { currentQuestion, questions } = activeQuiz;

    const revealAnswer = new Discord.RichEmbed()
      .setColor(Colors.GOLD)
      .addField("Time's up!", currentQuestion.answerText);

    channel.send(revealAnswer);

    if (currentQuestion.mediaUrls) {
      const answerImages = currentQuestion.mediaUrls.slice(currentQuestion.mainImageSlice[1]);

      answerImages.forEach((image) => {
        sendImage(channel, image);
      });
    }

    if (activeQuiz.survivalMode || questions.length === 0) {
      client.quizzes.set(roomId, null);
      endQuiz(channel, activeQuiz);
      return;
    }

    askNextQuestion(client, channel);
  };

  client.handleQuizResponse = async function handleQuizResponse(msg) {
    const roomId = msg.channel.id;
    const response = msg.content.toLowerCase();
    const activeQuiz = client.quizzes.get(roomId);
    const { currentQuestion, questions } = activeQuiz;

    if (!activeQuiz.survivalMode && response.startsWith(STOP_COMMAND)) {
      clearTimeout(activeQuiz.questionTimeout);
      clearTimeout(activeQuiz.nextQuestion);
      client.quizzes.set(roomId, null);

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
      .addField(`${msg.author.username} answered correctly!`, currentQuestion.answerText);

    msg.channel.send(congrats);

    if (currentQuestion.mediaUrls) {
      const answerImages = currentQuestion.mediaUrls.slice(currentQuestion.mainImageSlice[1]);

      answerImages.forEach((image) => {
        sendImage(msg.channel, image);
      });
    }

    await tryCatch(
      saveQuizProgress(msg, activeQuiz),
    );

    if (questions.length === 0) {
      client.quizzes.set(roomId, null);
      endQuiz(msg.channel, activeQuiz);
      return;
    }

    askNextQuestion(client, msg.channel);
  };
};
