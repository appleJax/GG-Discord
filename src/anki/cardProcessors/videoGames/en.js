/* eslint-disable array-bracket-spacing, prefer-const */

import urlencode from 'urlencode';
import { Card } from 'Models';
import { tryCatch } from 'Utils';
import {
  formatHint,
  getAnswers,
  minMaxChars,
  stripHtml,
} from 'Anki/utils';
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

      jpMeaning = jpMeaning.replace(/"/g, "'");
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

function formatAnswerText(answers, jpMeaning, webLookup) {
  const s = answers.length > 1 ? 's' : '';
  let answerText = `Answer${s}: ${answers.join(', ')}`;
  answerText += `\nJapanese: "${jpMeaning}"`;

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
  const hint = formatHint(expression);
  const [min, max] = minMaxChars(hint);
  const minMax = min === max ? min : `${min} or ${max}`;
  let tweetText = `What ${minMax} character answer means "${jpMeaning}"?`;

  if (notes) tweetText += `\nNotes: ${notes}`;

  tweetText += `\nGame: ${game.replace(/\s+JP$/, '')}`;

  return tweetText;
}
