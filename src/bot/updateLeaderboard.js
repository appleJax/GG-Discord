import DECKS from 'Config/decks';
import { Card, Deck, User } from 'Models';
import { tryCatch } from 'Utils';
import { percentage } from './utils';

export default async function updateLeaderboard(channel) {
  let users = await tryCatch(
    User
      .find()
      .sort({ correctAnswers: 'desc' })
      .limit(10)
      .exec(),
  );

  if (!users || users.length === 0) {
    return;
  }

  const everyone = users.find(user => user.username === 'everyone');
  users = users.filter(user => user.username !== 'everyone');

  const messageChunks = [];
  const userAggregate = [];

  const totalCards = await tryCatch(
    Card.count().exec(),
  );

  const deckCache = new Map();

  for (const user of users) {
    let uniqueCardsCorrect = 0;
    let deck;
    let subScore;

    for (const deckName of user.subScores) {
      if (deckCache.has(deckName)) {
        deck = deckCache.get(deckName);
      } else {
        deck = await tryCatch(
          Deck.findOne({ name: deckName }).lean().exec(),
        );

        if (!deck) {
          continue;
        }
        deckCache.set(deckName, deck);
      }
      subScore = deck.users.find(record => record.userId === user.userId);
      uniqueCardsCorrect += subScore.uniqueCardsCorrect.length;
    }

    userAggregate.push({
      username: user.username,
      uniqueCardsCorrect,
    });
  }

  userAggregate.sort((a, b) => b.uniqueCardsCorrect - a.uniqueCardsCorrect);

  let stats = '```asciidoc\n= Overall =';
  stats += `\n\nUnique Cards Correct (out of ${totalCards}):`;

  let nextUser = '';
  let currentScore = Infinity;
  let skip = 1;
  let rank = 0;

  for (const user of userAggregate) {
    if (user.uniqueCardsCorrect < currentScore) {
      rank += skip;
      skip = 1;
      currentScore = user.uniqueCardsCorrect;
    } else {
      skip++;
    }
    nextUser += `\n${rank}. ${user.username}: ${user.uniqueCardsCorrect} ${percentage(user.uniqueCardsCorrect, totalCards)}`;

    if (stats.length + nextUser.length > 1900) {
      messageChunks.push(stats);
      stats = nextUser;
    } else {
      stats += nextUser;
    }
    nextUser = '';
  }

  nextUser = '';
  currentScore = Infinity;
  skip = 1;
  rank = 0;

  stats += '\n\nTotal Cards Correct:';
  stats += `\n(everyone: ${everyone.correctAnswers})`;

  for (const user of users) {
    if (user.correctAnswers < currentScore) {
      rank += skip;
      skip = 1;
      currentScore = user.correctAnswers;
    } else {
      skip++;
    }
    nextUser += `\n${rank}. ${user.username}: ${user.correctAnswers}`;

    if (stats.length + nextUser.length > 1900) {
      messageChunks.push(stats);
      stats = nextUser;
    } else {
      stats += nextUser;
    }
    nextUser = '';
  }

  stats += '```';

  const decks = await tryCatch(
    Deck.find()
      .sort({ name: 'asc' })
      .lean()
      .exec(),
  );

  let deckUsers;
  let deckCards;

  for (const deck of decks) {
    if (deck.users.length === 0) {
      continue;
    }
    deckUsers = deck.users.sort(
      (a, b) => b.uniqueCardsCorrect.length - a.uniqueCardsCorrect.length,
    ).slice(0, 10);

    deckCards = await tryCatch(
      Card.count({ deck: deck.name }).exec(),
    );

    nextUser = '';
    currentScore = Infinity;
    skip = 1;
    rank = 0;

    stats += `\n${'```asciidoc'}\n= ${deck.name} =\n`;
    stats += `\nUnique Cards Correct (out of ${deckCards}):`;

    for (const user of deckUsers) {
      if (user.uniqueCardsCorrect.length < currentScore) {
        rank += skip;
        skip = 1;
        currentScore = user.uniqueCardsCorrect.length;
      } else {
        skip++;
      }
      nextUser += `\n${rank}. ${user.username}: ${user.uniqueCardsCorrect.length} ${percentage(user.uniqueCardsCorrect.length, deckCards)}`;

      if (stats.length + nextUser.length > 1900) {
        messageChunks.push(stats);
        stats = nextUser;
      } else {
        stats += nextUser;
      }
      nextUser = '';
    }

    if (deck.survivalRecord > 0) {
      stats += '\n\nSurvival Record:';
      deckUsers = deck.users.concat({
        username: 'everyone',
        survivalRecord: deck.survivalRecord,
      });
    }

    deckUsers = deckUsers
      .filter(u => u.survivalRecord > 0)
      .sort((a, b) => b.survivalRecord - a.survivalRecord)
      .slice(0, 10);

    nextUser = '';
    currentScore = Infinity;
    skip = 1;
    rank = 0;

    for (const user of deckUsers) {
      if (user.survivalRecord < currentScore) {
        rank += skip;
        skip = 1;
        currentScore = user.survivalRecord;
      } else {
        skip++;
      }
      nextUser += `\n${rank}. ${user.username}: ${user.survivalRecord}`;

      if (stats.length + nextUser.length > 1900) {
        messageChunks.push(stats);
        stats = nextUser;
      } else {
        stats += nextUser;
      }
      nextUser = '';
    }

    deckUsers = deck.users.sort((a, b) => b.correctAnswers - a.correctAnswers).slice(0, 10);

    nextUser = '';
    currentScore = Infinity;
    skip = 1;
    rank = 0;

    stats += '\n\nTotal Cards Correct:';
    stats += `\n(everyone: ${deck.correctAnswers})`;

    for (const user of deckUsers) {
      if (user.correctAnswers < currentScore) {
        rank += skip;
        skip = 1;
        currentScore = user.correctAnswers;
      } else {
        skip++;
      }
      nextUser += `\n${rank}. ${user.username}: ${user.correctAnswers}`;

      if (stats.length + nextUser.length > 1900) {
        messageChunks.push(stats);
        stats = nextUser;
      } else {
        stats += nextUser;
      }
      nextUser = '';
    }
    stats += '```';
  }

  messageChunks.push(stats);

  const leaderboard = channel.client.channels.get(DECKS.leaderboard);
  const oldMessages = await tryCatch(
    leaderboard.fetchMessages(),
  );

  if (oldMessages.size) {
    await tryCatch(
      leaderboard.bulkDelete(oldMessages.size),
    );
  }

  messageChunks.forEach(
    chunk => leaderboard.send(chunk),
  );
}
