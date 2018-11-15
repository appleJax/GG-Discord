/* eslint-disable */

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
        , // jpMeaning,
        engMeaning,
        , // officialEng,
        questionImages,
        answerImages,
        , // audio
        prevLineImages,
        prevLineAltText,
        , // otherVisibleContext,
        altAnswers,
        webLookup, // pronunciation lookup https://ejje.weblio.jp/content/[webLookup (e.g. 切り換える)]
        notes
      ] = card.fields;

      [ altAnswers,
        engMeaning,
        expression,
        prevLineAltText,
        // otherVisibleContext,
        notes
      ] = [
        altAnswers,
        engMeaning,
        expression,
        prevLineAltText,
        // otherVisibleContext,
        notes
      ].map(stripHtml);

      engMeaning = engMeaning.replace(/"/g, "'");
      const answers = getAnswers(expression, altAnswers);

      let imageProps = {};

      const oldCard = await tryCatch(
        Card.findOne({ cardId })
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
          persistImages(imageInfo, ImageStorage)
        );
      }

      newCards.push({
        ...imageProps,
        cardId,
        deck,
        game,
        questionText: formatQuestionText(engMeaning, expression, game, notes),
        answerText: formatAnswerText(answers, engMeaning, webLookup),
        answers,
      });
    }
  }

  return newCards;
}

export default processVideoGames;

// private

function formatAnswerText(answers, engMeaning, webLookup) {
  let answerText = '```\n答え: ' + answers.join(', ') + '```';
  answerText += '\n```\n英語: "' + engMeaning + '"```';

  if (webLookup) {
    answerText += `\n辞典: https://ejje.weblio.jp/content/${urlencode(webLookup)}`;
  }

  return answerText;
}

function formatQuestionText(
  engMeaning,
  expression,
  game,
  notes
) {
  const hint = formatHint(expression);
  const [min, max] = minMaxChars(hint);
  const minMax = min === max ? min : `${min} or ${max}`;
  let tweetText = `What ${minMax} character answer means "${engMeaning}"?`;

  if (notes) tweetText += `\nNotes: ${notes}`;

  tweetText += `\nGame: ${game.replace(/\s+JP$/, '')}`;

  return tweetText;
}
