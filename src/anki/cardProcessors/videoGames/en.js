/* eslint-disable array-bracket-spacing, prefer-const */

import urlencode from 'urlencode';
import { Card } from 'Models';
import { tryCatch } from 'Utils';
import { minMaxChars, stripHtml } from 'Anki/utils';
import persistImages from './persistImages';

async function processVideoGames(contents, ImageStorage) {
  const deck = contents.name;
  const newCards = [];

  for (const subdeck of contents.children) {
    const game = subdeck.name;

    for (const card of subdeck.notes) {
      let [
        cardId,
        expression,
        , // reading,
        jpMeaning,
        , // engMeaning,
        , // officialEng,
        questionImages,
        answerImages,
        , // audio
        prevLineImages,
        prevLineAltText,
        , // otherVisibleContext,
        altAnswers,
        webLookup, // pronunciation lookup https://ejje.weblio.jp/content/[webLookup (e.g. 切り換える)]
        notes,
      ] = card.fields;

      [ altAnswers,
        jpMeaning,
        expression,
        prevLineAltText,
        // otherVisibleContext,
        notes,
      ] = [
        altAnswers,
        jpMeaning,
        expression,
        prevLineAltText,
        // otherVisibleContext,
        notes,
      ].map(stripHtml);

      const answers = getAnswers(expression, altAnswers);

      let imageProps = {};

      const oldCard = await tryCatch(
        Card.findOne({ cardId }),
      );
      const hasImage = oldCard && oldCard.mediaUrls;

      if (hasImage) {
        imageProps.mainImageSlice = oldCard.mainImageSlice;
        imageProps.mediaUrls = oldCard.mediaUrls;
      } else {
        const imageInfo = {
          prevLineAltText,
          prevLineImages,
          questionImages,
          answerImages,
          expression,
          hint: formatHint(expression),
          game,
        };
        imageProps = await tryCatch(
          persistImages(imageInfo, ImageStorage),
        );
      }

      newCards.push({
        ...imageProps,
        cardId,
        deck,
        game,
        questionText: formatQuestionText(jpMeaning, expression, game, notes),
        answerText: formatAnswerText(answers, jpMeaning, webLookup),
        answers,
      });
    }
  }

  return newCards;
}

export default processVideoGames;

// private

function charCount(symbols) {
  return symbols.split('').reduce(
    (count, char) => count + (/-/.test(char) ? 5 : 1)
    , 0,
  );
}

function formatAnswerText(answers, jpMeaning, webLookup) {
  const s = answers.length > 1 ? 's' : '';
  let answerText = `Answer${s}: ${answers.join(', ')}`;
  answerText += `\nJapanese: 「${jpMeaning}」`;

  if (webLookup) {
    answerText += `\nWeblookup: https://ejje.weblio.jp/content/${urlencode(webLookup)}`;
  }

  return answerText;
}

function formatQuestionText(
  jpMeaning,
  expression,
  game,
  notes,
) {
  const [min, max] = minMaxChars(expression.replace(/\s+/g, ''));
  const minMax = min === max ? min : `${min} or ${max}`;

  let questionText = `どの(${wordCount(expression)})つの言葉に分けられた(${minMax})文字で「(${jpMeaning})」のような意味合いになりますか？`;

  if (notes) questionText += `\nNotes: ${notes}`;

  questionText += `\nGame: ${game.replace(/\s+EN$/, '')}`;

  return questionText;
}

function formatHint(expression) {
  const legend = expression.match(/::.+?::(.+?)}}/)[1];

  return legend.split(/\s+/).reduce((hint, group) => (
    /[?≠x]/.test(group)
      ? `${hint}[${group}]`
      : `${hint}[${charCount(group)}]`
  ), '');
}

function getAnswers(expression, altAnswers, i) {
  const officialAnswer = expression.match(/::(.+?)::/)[1];
  let otherAnswers = [];

  if (altAnswers) {
    otherAnswers = altAnswers
      .split('::')[i || 0];

    if (otherAnswers) {
      otherAnswers = otherAnswers.split(',').map(str => str.trim());
    }
  }

  return [officialAnswer].concat(otherAnswers).filter(Boolean);
}

function wordCount(expression) {
  return expression.match(/::.+?::(.+?)}}/)[1].split(/\s+/).length;
}
