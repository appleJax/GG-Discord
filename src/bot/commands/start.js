import Discord from 'discord.js';
import Models from 'Models';
import { tryCatch } from 'Utils';
import { Colors, sendImage } from '../utils';

const { Card } = Models;

export default {
  name: 'start',
  aliases: ['s'],
  description: 'Start a new quiz',
  usage: '[number of quiz questions]',
  async execute(msg, args) {
    const self = this;
    let [quizSize] = args;

    if (quizSize) {
      quizSize = Number(quizSize);
    } else {
      quizSize = 10;
    }

    /* eslint-disable-next-line */
    const questions = await tryCatch(newQuiz(quizSize));
    const currentQuestion = questions.pop();

    const activeQuiz = {
      currentQuestion,
      questions,
      timePerQuestion: 35000,
      questionPosition: [1, quizSize],
    };

    const startMsg = new Discord.RichEmbed()
      .setColor(Colors.BLUE)
      .addField(`Starting quiz, first question (1/${quizSize}):`, currentQuestion.questionText);

    msg.channel.send(startMsg);

    const questionImages = currentQuestion.mediaUrls.slice(0, currentQuestion.mainImageSlice[1]);

    questionImages.forEach((image) => {
      sendImage(msg.channel, image);
    });

    activeQuiz.questionTimeout = setTimeout(
      () => self.nextQuestion(msg.channel),
      activeQuiz.timePerQuestion,
    );
    this.activeQuiz = activeQuiz;
  },
};

function newQuiz(quizSize) {
  return Card.aggregate([
    { $sample: { size: quizSize } },
  ]);
}
