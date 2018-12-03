import DECKS from 'Config/decks';
import { Card, Deck, User } from 'Models';
import { formatNumber, tryCatch } from 'Utils';
import { percentage } from './utils';

export default async function updateLeaderboard(channel) {
  let users = await tryCatch(
    User
      .find()
      .sort({ correctAnswers: 'desc' })
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

  let currentScore = Infinity;
  let skip = 1;
  let rank = 0;

  let stats = '```asciidoc\n= Overall =';

  stats += '\n\nTotal Cards Correct:';
  stats += `\n(everyone: ${formatNumber(everyone.correctAnswers)})`;

  for (const user of users) {
    if (user.correctAnswers < currentScore) {
      rank += skip;
      skip = 1;
      currentScore = user.correctAnswers;
    } else {
      skip++;
    }
    stats += `\n${rank}. ${user.username}: ${formatNumber(user.correctAnswers)}`;
  }

  currentScore = Infinity;
  skip = 1;
  rank = 0;

  if (userAggregate.length > 0) {
    stats += `\n\nUnique Cards Correct (out of ${formatNumber(totalCards)}):`;
  }

  for (const user of userAggregate) {
    if (user.uniqueCardsCorrect < currentScore) {
      rank += skip;
      skip = 1;
      currentScore = user.uniqueCardsCorrect;
    } else {
      skip++;
    }
    stats += `\n${rank}. ${user.username}: ${formatNumber(user.uniqueCardsCorrect)} ${percentage(user.uniqueCardsCorrect, totalCards)}`;
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
    deckUsers = deck.users.sort(
      (a, b) => b.uniqueCardsCorrect.length - a.uniqueCardsCorrect.length,
    ).slice(0, 10);

    deckCards = await tryCatch(
      Card.count({ deck: deck.name }).exec(),
    );

    currentScore = Infinity;
    skip = 1;
    rank = 0;

    stats += `\n${'```asciidoc'}\n= ${deck.name} =`;

    stats += '\n\nTotal Cards Correct:';
    stats += `\n(everyone: ${formatNumber(deck.correctAnswers)})`;

    for (const user of deckUsers) {
      if (user.correctAnswers < currentScore) {
        rank += skip;
        skip = 1;
        currentScore = user.correctAnswers;
      } else {
        skip++;
      }
      stats += `\n${rank}. ${user.username}: ${formatNumber(user.correctAnswers)}`;
    }

    deckUsers = deck.users.sort((a, b) => b.correctAnswers - a.correctAnswers).slice(0, 10);

    currentScore = Infinity;
    skip = 1;
    rank = 0;

    if (deckUsers.length > 0) {
      stats += `\n\nUnique Cards Correct (out of ${formatNumber(deckCards)}):`;
    }

    for (const user of deckUsers) {
      if (user.uniqueCardsCorrect.length < currentScore) {
        rank += skip;
        skip = 1;
        currentScore = user.uniqueCardsCorrect.length;
      } else {
        skip++;
      }
      stats += `\n${rank}. ${user.username}: ${formatNumber(user.uniqueCardsCorrect.length)} ${percentage(user.uniqueCardsCorrect.length, deckCards)}`;
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
      stats += `\n${rank}. ${user.username}: ${formatNumber(user.survivalRecord)}`;
    }

    stats += '```';
  }

  const leaderboard = channel.client.channels.get(DECKS.leaderboard);
  const oldMessages = await tryCatch(
    leaderboard.fetchMessages(),
  );

  if (oldMessages.size) {
    await tryCatch(
      leaderboard.bulkDelete(oldMessages.size),
    );
  }

  while (stats.length > 1950) {
    messageChunks.push(`${stats.slice(0, 1950)}${'```'}`);
    stats = `${'```'}${stats.slice(1950)}`;
  }

  messageChunks.push(stats);

  for (const chunk of messageChunks) {
    await tryCatch(
      leaderboard.send(chunk),
    );
  }
}
