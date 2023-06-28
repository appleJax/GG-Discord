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
  const deck = "Video Games";
  const newCards = [];

  const game = contents.name;

  for (const card of contents.notes) {
    let [
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
      notes,
      , // unused
      cardId,
    ] = card.fields;

    [ altAnswers,
      engMeaning,
      expression,
      prevLineAltText,
      // otherVisibleContext,
      notes,
    ] = [
      altAnswers,
      engMeaning,
      expression,
      prevLineAltText,
      // otherVisibleContext,
      notes,
    ].map(stripHtml);

    engMeaning = engMeaning.replace(/"/g, "'");
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
      try {
        imageProps = await persistImages(imageInfo, ImageStorage);
      } catch (err) {
        continue;
      }
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

  return newCards;
}

export default processVideoGames;

// private

function formatAnswerText(answers, engMeaning, webLookup) {
  let answerText = `答え: ${answers.join(', ')}`;
  answerText += `\n英語: "${engMeaning}"`;

  if (webLookup) {
    answerText += `\n辞典: https://ejje.weblio.jp/content/${urlencode(webLookup)}`;
  }

  return answerText;
}

function formatQuestionText(
  engMeaning,
  expression,
  game,
  notes,
) {
  const [min, max] = minMaxChars(expression);
  const minMax = min === max ? min : `${min} or ${max}`;
  let tweetText = `What ${minMax} character answer means "${engMeaning}"?`;

  if (notes) tweetText += `\nNotes: ${notes}`;

  tweetText += `\nGame: ${game.replace(/\s+JP$/, '')}`;

  return tweetText;
}
