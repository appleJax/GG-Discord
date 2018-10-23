import Discord from 'discord.js';
import Models from 'Models';
import { tryCatch } from 'Utils';
import { Colors } from '../utils';

const { Card } = Models;

export default {
  name: 'start',
  aliases: ['s'],
  description: 'Start a new quiz',
  usage: '',
  async execute(msg, args) {
    const self = this;

    /* eslint-disable-next-line */
    const questions = await tryCatch(newQuiz());
    const currentQuestion = questions.pop();

    const activeQuiz = {
      currentQuestion,
      questions,
      timePerQuestion: 30000,
    };

    const startMsg = new Discord.RichEmbed()
      .setColor(Colors.BLUE)
      .addField('Starting quiz, first question (1/10):', currentQuestion.questionText);

    msg.channel.send(startMsg);

    activeQuiz.questionTimeout = setTimeout(
      () => self.nextQuestion(msg.channel),
      activeQuiz.timePerQuestion,
    );
    this.activeQuiz = activeQuiz;
  },
};

function newQuiz() {
  return Card.aggregate([
    { $sample: { size: 10 } },
  ]);
}
