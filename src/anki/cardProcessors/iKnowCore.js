/* eslint-disable array-bracket-spacing, prefer-const */

import { Card } from 'Models';
import { tryCatch } from 'Utils';
import {
  formatQuestionText,
  formatAnswerText,
  getAnswers,
  getImageNames,
  stripHtml,
} from 'Anki/utils';

async function processIKnowCore(contents, ImageStorage) {
  const deck = contents.name;
  const newCards = [];

  for (const subdeck of contents.children) {
    const reference = subdeck.name;

    for (const card of subdeck.notes) {
      let [
        cardId,
        expression,
        , // reading,
        engMeaning,
        altAnswers,
        , // audio,
        image,
      ] = card.fields;

      [engMeaning,
        expression,
      ] = [
        engMeaning,
        expression,
      ].map(stripHtml);

      const answers = getAnswers(expression, altAnswers);

      const imageProps = {};

      if (image) {
        const oldCard = await tryCatch(
          Card.findOne({ cardId }),
        );
        const hasImage = oldCard && oldCard.mediaUrls;
        if (hasImage) {
          imageProps.mainImageSlice = oldCard.mainImageSlice;
          imageProps.mediaUrls = oldCard.mediaUrls;
        } else {
          const options = {
            folder: deck,
            use_filename: true,
            unique_filename: false,
          };

          const cardImg = getImageNames(image)[0];
          const imageUrl = await tryCatch(
            ImageStorage.upload(cardImg, options),
          );
          imageProps.mainImageSlice = [0, 1];
          imageProps.mediaUrls = [
            { image: imageUrl },
          ];
        }
      }

      newCards.push({
        ...imageProps,
        cardId,
        deck,
        answers,
        answerText: formatAnswerText(engMeaning, expression, answers, reference),
        questionText: formatQuestionText(engMeaning, expression),
      });
    }
  }

  return newCards;
}

export default processIKnowCore;
