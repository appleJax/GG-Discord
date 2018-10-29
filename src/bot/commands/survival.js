import Discord from 'discord.js';
import { tryCatch } from 'Utils';
import {
  Colors, DECKS, fetchCards, fetchHighScore, sendImage,
} from '../utils';

const TIME_PER_QUESTION = 60;

export default {
  name: 'survival',
  description: `This quiz serves questions continuously until one expires without being answered correctly. You have ${TIME_PER_QUESTION} seconds to answer each question.`,
  async execute(msg) {
    const self = this;
    const roomId = msg.channel.id;

    const deckQuery = {
      deck: DECKS[roomId],
    };

    const highScore = await tryCatch(
      fetchHighScore(roomId),
    );

    /* eslint-disable-next-line */
    const questions = await tryCatch(
      fetchCards(deckQuery, 10),
    );

    if (!questions || questions.length === 0) {
      const errorMsg = new Discord.RichEmbed()
        .setColor(Colors.RED)
        .setDescription('Sorry, something went wrong');

      msg.channel.send(errorMsg);
      return;
    }

    const currentQuestion = questions.pop();

    const activeQuiz = {
      currentQuestion,
      questions,
      secondsPerQuestion: TIME_PER_QUESTION * 1000,
      questionPosition: [1, '??'],
      highScore,
      survivalMode: true,
    };

    const startMsg = new Discord.RichEmbed()
      .setColor(Colors.BLUE)
      .addField('Starting quiz, first question:', currentQuestion.questionText);

    msg.channel.send(startMsg);

    if (currentQuestion.mediaUrls) {
      const questionImages = currentQuestion.mediaUrls.slice(0, currentQuestion.mainImageSlice[1]);

      questionImages.forEach((image) => {
        sendImage(msg.channel, image);
      });
    }

    activeQuiz.questionTimeout = setTimeout(
      () => self.nextQuestion(msg.channel),
      activeQuiz.secondsPerQuestion,
    );
    this.quizzes.set(roomId, activeQuiz);
  },
};
