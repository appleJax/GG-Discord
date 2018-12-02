import Discord from 'discord.js';
import { Card, Deck, Quiz } from 'Models';
import { formatNumber, tryCatch } from 'Utils';
import DECKS from 'Config/decks';
import updateLeaderboard from './updateLeaderboard';

export const PACE_DELAY = 12000;
export const PREFIX = 'gg!';

export const Colors = {
  BLUE: '#1DA1F2',
  GOLD: '#F9A602',
  GREEN: '#008140',
  PURPLE: '#633193',
  RED: '#CA0401',
};

export function prepareNextQuestion(channel, activeQuiz) {
  const { questionPosition, solo, survivalRecord } = activeQuiz;

  if (survivalRecord && questionPosition[0] === survivalRecord) {
    const s = survivalRecord === 1 ? '' : 's';
    const tiedSurvivalRecord = new Discord.RichEmbed()
      .setColor(Colors.GREEN)
      .setDescription(`👔 You are now tied with ${solo ? 'your' : 'the'} previous record of ${survivalRecord} correct answer${s} in a row!`);

    sendWithRetry(channel, tiedSurvivalRecord);
  }

  activeQuiz.onDeckQuestion = activeQuiz.questions.pop();
  activeQuiz.currentQuestion = { answers: [] };
  /* eslint-disable-next-line */
  activeQuiz.questionPosition[0]++;
}

export async function askNextQuestion(channel) {
  const { id: roomId } = channel;
  const activeQuiz = channel.client.quizzes.get(channel.id);

  activeQuiz.currentQuestion = activeQuiz.onDeckQuestion;
  const { currentQuestion } = activeQuiz;

  const [currentPosition, totalQuestions] = activeQuiz.questionPosition;
  const position = `${currentPosition}/${totalQuestions}`;

  const nextMessage = new Discord.RichEmbed()
    .setColor(Colors.BLUE)
    .addField(`Next Question (${position}):`, currentQuestion.questionText);

  let questionImages = [];
  if (currentQuestion.mediaUrls) {
    questionImages = currentQuestion.mediaUrls.slice(0, currentQuestion.mainImageSlice[1]);
  }

  await tryCatch(
    sendWithRetry(channel, nextMessage),
  );

  questionImages.forEach((image) => {
    sendImage(channel, image);
  });

  activeQuiz.questionTimeout = setTimeout(
    () => channel.client.nextQuestion(channel),
    activeQuiz.secondsPerQuestion * 1000,
  );

  if (activeQuiz.survivalMode) {
    if (activeQuiz.questions.length < 5) {
      const deckQuery = {
        deck: DECKS[channel.id],
      };

      const newCards = await tryCatch(
        fetchCards(deckQuery, 10),
      );
      activeQuiz.questions = activeQuiz.questions.concat(newCards);
    }
  }

  const questionTimeout = Date.now() + (activeQuiz.secondsPerQuestion * 1000);
  const updatedQuiz = {
    ...activeQuiz,
    roomId,
    currentQuestion: activeQuiz.currentQuestion._id,
    onDeckQuestion: null,
    questions: activeQuiz.questions.map(obj => obj._id),
    questionTimeout: null,
    nextQuestion: null,
    timer: {
      name: 'questionTimeout',
      time: questionTimeout,
    },

  };
  Quiz.replaceOne(
    { roomId },
    updatedQuiz,
  ).exec().catch(console.error);
}

export function commandNotFound(command) {
  let userCommand = '.';
  if (command) {
    userCommand = `: \`${command}\``;
  }
  let notFound = `sorry, I don't understand that command${userCommand}\n`;
  notFound += `Use \`${PREFIX}help\` to see a list of all my commands.`;
  return notFound;
}

export function deckPercentageCorrect(uniqueCardsCorrect, totalCards) {
  const cardCounts = `${formatNumber(uniqueCardsCorrect)}/${formatNumber(totalCards)}`;
  return `${cardCounts} ${percentage(uniqueCardsCorrect, totalCards)}`;
}

export async function endQuiz(channel, activeQuiz = {}) {
  const { solo, survivalMode, points } = activeQuiz;
  const currentScore = activeQuiz.questionPosition[0] - 1;
  const endMsg = new Discord.RichEmbed();
  let { survivalRecord } = activeQuiz;

  let pointsMsg = '';

  if (!solo && points.length > 0) {
    const DESC = (a, b) => b.correctAnswers - a.correctAnswers;
    const userPoints = points
      .sort(DESC)
      .map(user => `${user.username}: ${user.correctAnswers}`)
      .join('\n');

    pointsMsg = `\n\nCorrect Answers:\n${userPoints}`;
  }

  const deckName = DECKS[channel.id];

  if (survivalMode && solo) {
    const deck = await tryCatch(
      Deck
        .findOne({ name: deckName })
        .exec(),
    );

    const currentUser = deck && deck.users.find(user => user.userId === activeQuiz.solo.id);
    if (currentUser) {
      /* eslint-disable-next-line */
      survivalRecord = currentUser.survivalRecord;

      if (currentScore > survivalRecord) {
        currentUser.survivalRecord = currentScore;
        await tryCatch(
          Deck.updateOne(
            { name: deckName },
            { $set: { users: deck.users } },
          ),
        );
      }
    }
  }

  const playAgain = command => `\n\nType \`${PREFIX}${command}\` to play again.`;
  const summary = command => `${pointsMsg}${playAgain(command)}`;
  const s = currentScore === 1 ? '' : 's';

  if (survivalMode && currentScore > survivalRecord) {
    endMsg
      .setColor(Colors.PURPLE)
      .setDescription(`🏆 Congratulations, you set a new ${solo ? 'personal ' : ''}record for this quiz with ${currentScore} correct answer${s} in a row, beating ${solo ? 'your' : 'the'} previous record of ${survivalRecord}!${summary('survival')}`);

    setSurvivalRecord(deckName, currentScore);
  } else if (survivalMode && currentScore === survivalRecord) {
    endMsg
      .setColor(Colors.GREEN)
      .setDescription(`Congratulations, you tied ${solo ? 'your' : 'the'} current record of ${currentScore} correct answer${s} in a row!${summary('survival')}`);
  } else if (survivalMode) {
    endMsg
      .setColor(Colors.BLUE)
      .setDescription(`Thanks for playing, you correctly answered ${currentScore} question${s} in a row!\nCurrent record: ${survivalRecord}${summary('survival')}`);
  } else {
    endMsg
      .setColor(Colors.BLUE)
      .setDescription(`That's it, thanks for playing!${summary('start')}`);
  }

  sendWithRetry(channel, endMsg);

  const roomId = channel.id;
  channel.client.quizzes.set(roomId, null);
  Quiz.deleteOne({ roomId }).exec().catch(console.error);

  if (points.length > 0) {
    await tryCatch(
      updateLeaderboard(channel),
    );
  }
}

export function fetchCards(deckQuery, quizSize) {
  return Card.aggregate([
    { $match: deckQuery },
    { $sample: { size: quizSize } },
  ]);
}

export function fetchSurvivalRecord(deckName) {
  return Deck
    .findOne({ name: deckName })
    .then(deck => (deck && deck.survivalRecord) || 0);
}

export function isPatron(member) {
  return !!member.roles.find(
    role => ['Quiz Patron', 'admin'].includes(role.name),
  );
}

export function parseInput(msg) {
  const args = msg.content.substr(PREFIX.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();
  return [command, args];
}

export function percentage(uniqueCardsCorrect, totalCards) {
  const cardPercentage = Math.round(
    (uniqueCardsCorrect / totalCards) * 10000,
  ) / 100;
  return `(${cardPercentage}%)`;
}

export function sendImage(channel, image) {
  const message = new Discord.RichEmbed()
    .setColor(Colors.BLUE)
    .setImage(image.image)
    .setDescription(image.altText || '');

  sendWithRetry(channel, message);
}

export function sendWithRetry(channel, msg) {
  return channel.send(msg)
    .catch(() => {
      setTimeout(() => {
        channel.send(msg)
          .catch(() => {
            setTimeout(() => {
              channel.send(msg)
                .catch(() => {
                  setTimeout(() => {
                    channel.send(msg)
                      .catch(() => {
                        channel.send('Sorry, discord is having connection issues. Some messages may have been lost.')
                          .catch(console.error);
                      });
                  }, 5000);
                });
            }, 3000);
          });
      }, 1000);
    });
}


export function shouldIgnore(msg) {
  return !msg.content.toLowerCase().startsWith(PREFIX) || msg.author.bot;
}

// private
function setSurvivalRecord(deckName, survivalRecord) {
  Deck.updateOne(
    { name: deckName },
    { $set: { survivalRecord } },
  ).catch(console.error);
}
