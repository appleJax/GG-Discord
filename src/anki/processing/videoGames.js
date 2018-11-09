/* eslint-disable */

import uploadImage from 'Config/cloudinary';
import Card from 'Models/Card';
import { tryCatch } from 'Utils';
import {
  formatQuestionText,
  formatAnswerText,
  getAnswers,
  getImageNames,
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

          altText = mediaUrls.length ? prevLineAltText : '';
          mediaUrls.push({
            altText,
            image: cloudinaryUrl
          });
        }

        for (const img of questionImages) {

        }

        imageProps.mediaUrls = mediaUrls;
      }

      game; // INCORPORATE INTO QUESTION/ANSWER TEXT
      // ??? otherVisibleContext

      // ADD TO mediaUrls
      // ??? prevLineImages: upperSliceIndex < 5 ? prevLineImages : [],
      // ADD TO mediaUrls


      newCards.push({
        ...imageProps,
        cardId,
        deck,
        game,
        questionText:    formatQuestionText(engMeaning, expression, game, notes),
        answerText:      formatAnswerText(answers, cardId, engMeaning, webLookup),
        answers,
      });
    }
  }

  return newCards;
}

export default parseVideoGames;