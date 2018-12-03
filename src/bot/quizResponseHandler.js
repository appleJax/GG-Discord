import Discord from 'discord.js';
import { tryCatch } from 'Utils';
import { Quiz } from 'Models';
import saveQuizProgress from './saveQuizProgress';
import {
  PREFIX,
  Colors,
  askNextQuestion,
  endQuiz,
  prepareNextQuestion,
  sendImage,
  sendWithRetry,
} from './utils';

const END_DELAY = 2000;
const STOP_COMMAND = `${PREFIX}stop`;

export default (client) => {
  client.nextQuestion = async (channel) => {
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

    sendWithRetry(channel, revealAnswer);

    if (currentQuestion.mediaUrls) {
      const answerImages = currentQuestion.mediaUrls.slice(currentQuestion.mainImageSlice[1]);

      answerImages.forEach((image) => {
        sendImage(channel, image);
      });
    }

    if (activeQuiz.survivalMode || questions.length === 0) {
      setTimeout(
        () => endQuiz(channel, activeQuiz),
        activeQuiz.endDelay,
      );

      const endQuizTime = Date.now() + activeQuiz.endDelay;
      Quiz.updateOne(
        { roomId },
        {
          $set: {
            'timer.name': 'endQuiz',
            'timer.time': endQuizTime,
          },
        },
      ).exec().catch(console.error);

      return;
    }

    prepareNextQuestion(channel, activeQuiz);

    activeQuiz.nextQuestion = setTimeout(
      () => askNextQuestion(channel),
      activeQuiz.paceDelay,
    );

    const askNextQuestionTime = Date.now() + activeQuiz.paceDelay;
    const updatedQuiz = {
      ...activeQuiz,
      roomId,
      currentQuestion: activeQuiz.currentQuestion._id,
      onDeckQuestion: activeQuiz.onDeckQuestion._id,
      questions: activeQuiz.questions.map(obj => obj._id),
      questionTimeout: null,
      nextQuestion: null,
      timer: {
        name: 'askNextQuestion',
        time: askNextQuestionTime,
      },

    };

    Quiz.replaceOne(
      { roomId },
      updatedQuiz,
    ).exec().catch(console.error);
  };

  client.handleQuizResponse = async function handleQuizResponse(msg) {
    const { channel } = msg;
    const roomId = channel.id;
    const response = msg.content.toLowerCase();
    const activeQuiz = client.quizzes.get(roomId);
    const { currentQuestion, questions } = activeQuiz;

    if (!activeQuiz.survivalMode && response.startsWith(STOP_COMMAND)) {
      clearTimeout(activeQuiz.questionTimeout);
      clearTimeout(activeQuiz.nextQuestion);
      client.quizzes.set(roomId, null);
      Quiz.deleteOne({ roomId }).exec().catch(console.error);

      const stopMsg = new Discord.RichEmbed()
        .setColor(Colors.RED)
        .setDescription('Stopping quiz... 😢');

      sendWithRetry(channel, stopMsg);
      return;
    }

    if (activeQuiz.solo && !msg.author.bot && activeQuiz.solo.id !== msg.author.id) {
      if (!activeQuiz.rebukes.includes(msg.author.id)) {
        msg.reply(`the quiz is in Solo Mode. Only ${activeQuiz.solo.username} can answer.`);
        activeQuiz.rebukes.push(msg.author.id);
      }
      return;
    }

    if (!currentQuestion.answers.includes(response)) {
      return;
    }

    clearTimeout(activeQuiz.questionTimeout);

    const congrats = new Discord.RichEmbed()
      .setColor(Colors.GREEN)
      .addField(`${msg.author.username} answered correctly!`, currentQuestion.answerText);

    sendWithRetry(channel, congrats);

    if (currentQuestion.mediaUrls) {
      const answerImages = currentQuestion.mediaUrls.slice(currentQuestion.mainImageSlice[1]);

      answerImages.forEach((image) => {
        sendImage(channel, image);
      });
    }

    await tryCatch(
      saveQuizProgress(msg, activeQuiz),
    );

    if (questions.length === 0) {
      setTimeout(
        () => endQuiz(channel, activeQuiz),
        activeQuiz.endDelay,
      );

      const endQuizTime = Date.now() + activeQuiz.endDelay;
      Quiz.updateOne(
        { roomId },
        {
          $set: {
            timer: {
              name: 'endQuiz',
              time: endQuizTime,
            },
          },
        },
      ).exec().catch(console.error);
      return;
    }

    prepareNextQuestion(channel, activeQuiz);

    activeQuiz.nextQuestion = setTimeout(
      () => askNextQuestion(channel),
      activeQuiz.paceDelay,
    );

    const askNextQuestionTime = Date.now() + activeQuiz.paceDelay;
    const updatedQuiz = {
      ...activeQuiz,
      roomId,
      currentQuestion: activeQuiz.currentQuestion._id,
      onDeckQuestion: activeQuiz.onDeckQuestion._id,
      questions: activeQuiz.questions.map(obj => obj._id),
      questionTimeout: null,
      nextQuestion: null,
      timer: {
        name: 'askNextQuestion',
        time: askNextQuestionTime,
      },

    };
    Quiz.replaceOne(
      { roomId },
      updatedQuiz,
    ).exec().catch(console.error);
  };
};
