/* eslint-disable */

import urlencode from 'urlencode';
import uploadImage from 'Config/cloudinary';
import Card from 'Models/Card';
import { tryCatch } from 'Utils';
import {
  formatHint,
  getAnswers,
  getImageNames,
  minMaxChars,
  stripHtml,
} from 'Anki/utils';

async function parseVideoGames(contents) {
  const deck = contents.name;
  const newCards = [];

  for (const subdeck of contents.children) {
    const game = subdeck.name.replace(/::.+/, '');

    for (const card of subdeck.notes) {
      let [
        cardId,
        expression,
        , // reading,
        jpMeaning,
        engMeaning,
        , // officialEng,
        questionImages,
        answerImages,
        , // audio
        prevLineImages,
        prevLineAltText,
        otherVisibleContext,
        altAnswers,
        webLookup, // pronunciation lookup https://ejje.weblio.jp/content/[webLookup (e.g. 切り換える)]
        notes
      ] = card.fields;

      [ altAnswers,
        engMeaning,
        expression,
        prevLineAltText,
        otherVisibleContext,
        notes
      ] = [
        altAnswers,
        engMeaning,
        expression,
        prevLineAltText,
        otherVisibleContext,
        notes
      ].map(stripHtml);

      engMeaning = engMeaning.replace(/"/g, "'");
      const answers = getAnswers(expression, altAnswers);

      const imageProps = {};

      const oldCard = await tryCatch(
        Card.findOne({ cardId })
      );
      const hasImage = oldCard && oldCard.mediaUrls;
      if (hasImage) {
        imageProps.mainImageSlice = oldCard.mainImageSlice;
        imageProps.mediaUrls = oldCard.mediaUrls;
      } else {
        prevLineImages = getImageNames(prevLineImages);
        questionImages = getImageNames(questionImages);
        answerImages = getImageNames(answerImages);

        const lowerSliceIndex = prevLineImages.length;
        const upperSliceIndex = lowerSliceIndex + questionImages.length;
        const mainImageSlice = [ lowerSliceIndex, upperSliceIndex ];

        imageProps.mainImageSlice = mainImageSlice;
        const mediaUrls = [];

        const options = {
          folder: deck,
          use_filename: true,
          unique_filename: false,
        };

        questionAltText = formatQuestionAltText(expression);
        answerAltText = formatAnswerAltText(expression);

        let altText
        for (const img of prevLineImages) {
          cloudinaryUrl = await tryCatch(
            uploadImage(img, options)
          );

          altText = mediaUrls.length ? '' : prevLineAltText;
          mediaUrls.push({
            altText,
            image: cloudinaryUrl
          });
        }

        for (const img of questionImages) {
          cloudinaryUrl = await tryCatch(
            uploadImage(img, options)
          );

          altText = (mediaUrls.length > prevLineImages.length)
            ? ''
            : questionAltText;

          mediaUrls.push({
            altText,
            image: cloudinaryUrl
          });
        }

        for (const img of answerImages) {
          cloudinaryUrl = await tryCatch(
            uploadImage(img, options)
          );

          altText = (mediaUrls.length > upperSliceIndex)
            ? ''
            : answerAltText;

          mediaUrls.push({
            altText,
            image: cloudinaryUrl
          });
        }

        imageProps.mediaUrls = mediaUrls;
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

export default parseVideoGames;

// private

function formatAnswerAltText(expression) {
  return expression.replace(/\{\{.*?::(.+?)::.*?\}\}/g, '$1');
}

function formatAnswerText(answers, engMeaning, webLookup) {
  let answerText = `答え: ${answers.join(', ')}`;
  answerText += `\n英語: "${engMeaning}"`;

  if (webLookup) {
    answerText += `\n辞典: https://ejje.weblio.jp/content/${urlencode(webLookup)}`;
  }

  return answerText;
}

function formatQuestionAltText(expression) {
  const hint = formatHint(expression);
  const [min, max] = minMaxChars(hint);
  const minMax = min === max ? min : `${min} to ${max}`;
  const s = max > 1 ? 's' : '';
  const screenReaderHint = `(${minMax} character${s})`;
  return expression.replace(/\{\{.+?\}\}/g, screenReaderHint);
}

function formatQuestionText(
  engMeaning,
  expression,
  game,
  notes
) {
  const hint = formatHint(expression);
  const [min, max] = minMaxChars(hint);
  const minMax = min === max ? min : `${min}-${max}`;
  let tweetText = `What ${minMax} character answer means "${engMeaning}"?`;

  if (needsHint(hint)) tweetText += `\nHint: ${hint}`;

  if (notes) tweetText += `\nNotes: ${notes}`;

  tweetText += `\nGame: ${game.replace(/\s+JP$/, '')}`;

  return tweetText;
}
