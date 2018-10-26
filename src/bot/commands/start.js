import Discord from 'discord.js';
import Models from 'Models';
import { tryCatch } from 'Utils';
import {
 Colors, DECKS, TIME_PER_QUESTION, sendImage 
} from '../utils';

const { Card } = Models;

export default {
  name: 'start',
  aliases: ['s'],
  description: 'Start a new quiz',
  usage: '[number of questions (defaults to 10, max is 30)]',
  async execute(msg, args) {
    const self = this;
    let [quizSize] = args;

    quizSize = Math.round(Number(quizSize));

    if (Number.isNaN(quizSize) || quizSize < 1) {
      quizSize = 10;
    }

    quizSize = Math.min(quizSize, 30);

    const deckQuery = {
      deck: DECKS[msg.channel.id],
    };

    /* eslint-disable-next-line */
    const questions = await tryCatch(newQuiz(deckQuery, quizSize));
    const currentQuestion = questions.pop();

    const activeQuiz = {
      currentQuestion,
      questions,
      timePerQuestion: TIME_PER_QUESTION,
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

function newQuiz(deckQuery, quizSize) {
  return Card.aggregate([
    { $match: deckQuery },
    { $sample: { size: quizSize } },
  ]);
}
