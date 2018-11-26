import Discord from 'discord.js';
import { tryCatch } from 'Utils';
import DECKS from 'Config/decks';
import {
  Colors, fetchCards, fetchSurvivalRecord, sendImage,
} from '../utils';

const SECONDS_PER_QUESTION = 60;

export default {
  name: 'survival',
  description: `This quiz serves questions continuously until one expires without being answered correctly. You have ${SECONDS_PER_QUESTION} seconds to answer each question.`,
  usage: '(Survival Mode)',
  async execute(msg) {
    const self = this;
    const { channel } = msg;
    const roomId = channel.id;
    const deckName = DECKS[roomId];

    const deckQuery = {
      deck: deckName,
    };

    const survivalRecord = await tryCatch(
      fetchSurvivalRecord(deckName),
    );

    /* eslint-disable-next-line */
    const questions = await tryCatch(
      fetchCards(deckQuery, 200),
    );

    if (!questions || questions.length === 0) {
      const errorMsg = new Discord.RichEmbed()
        .setColor(Colors.RED)
        .setDescription('Sorry, something went wrong');

      channel.send(errorMsg);
      return;
    }

    const currentQuestion = questions.pop();

    let solo = null;
    if (DECKS.soloSurvival.includes(roomId)) {
      solo = {
        id: msg.author.id,
        username: msg.author.username,
      };
    }

    const activeQuiz = {
      currentQuestion,
      points: [],
      questions,
      questionPosition: [1, '??'],
      rebukes: [],
      secondsPerQuestion: SECONDS_PER_QUESTION,
      solo,
      survivalRecord,
      survivalMode: true,
    };

    const startMsg = new Discord.RichEmbed()
      .setColor(Colors.BLUE)
      .addField(`Starting quiz, see how long you can survive! Current record: ${survivalRecord} correct answers`, currentQuestion.questionText);

    msg.channel.send(startMsg);

    if (currentQuestion.mediaUrls) {
      const questionImages = currentQuestion.mediaUrls.slice(0, currentQuestion.mainImageSlice[1]);

      questionImages.forEach((image) => {
        sendImage(channel, image);
      });
    }

    activeQuiz.questionTimeout = setTimeout(
      () => self.nextQuestion(channel),
      activeQuiz.secondsPerQuestion * 1000,
    );
    this.quizzes.set(roomId, activeQuiz);
  },
};
