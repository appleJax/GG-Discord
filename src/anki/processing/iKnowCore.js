/* eslint-disable */

import {
  formatQuestionText,
  formatAnswerText,
  getAnswers,
  stripHtml,
} from 'Anki/utils';

function parseIKnowCore(contents) {
  const deck = contents.name;
  const newCards = [];

  contents.children.forEach((subdeck) => {
    const reference = subdeck.name;

    subdeck.notes.forEach((card) => {
      let [
        cardId,
        expression,
        , // reading,
        engMeaning,
        altAnswers,
        , // audio,
        image,
      ] = card.fields;

      [ engMeaning,
        expression,
      ] = [
        engMeaning,
        expression,
      ].map(stripHtml);

      const answers = getAnswers(expression, altAnswers);

      let imageProps = {};
      if (image) {
        // await upload image to cloudinary
        imageProps.mainImageSlice = [ 0, 1 ];
        imageProps.mediaUrls = [
          { image: cloudinaryUrl }
        ];
      }

      newCards.push({
        ...imageProps,
        cardId,
        deck,
        answers,
        answerText: formatAnswerText(engMeaning, expression, answers, reference),
        questionText: formatQuestionText(engMeaning, expression),
      });
    });
  });

  return newCards;
}

export default parseIKnowCore;
