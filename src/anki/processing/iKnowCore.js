/* eslint-disable */
import uploadImage from 'Config/cloudinary';
import Card from 'Models/Card';
import { tryCatch } from 'Utils';
import {
  UPLOADS_PATH,
  formatQuestionText,
  formatAnswerText,
  getAnswers,
  stripHtml,
} from 'Anki/utils';

async function parseIKnowCore(contents) {
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

      [ engMeaning,
        expression,
      ] = [
        engMeaning,
        expression,
      ].map(stripHtml);

      const answers = getAnswers(expression, altAnswers);

      let imageProps = {};
      let cloudinaryUrl;

      if (image) {
        const oldCard = await tryCatch(
          Card.findOne({ cardId })
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
          cloudinaryUrl = await tryCatch(
            uploadImage(getImage(image), options)
          );
          imageProps.mainImageSlice = [ 0, 1 ];
          imageProps.mediaUrls = [
            { image: cloudinaryUrl }
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

export default parseIKnowCore;

// private

function getImage(string) {
  const imageName = string.match(/src="(.+?)"/)[1];
  return `${UPLOADS_PATH}/media/${imageName}`;
}
