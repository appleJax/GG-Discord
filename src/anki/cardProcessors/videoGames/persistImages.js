import { tryCatch } from 'Utils';
import {
  formatHint,
  getImageNames,
  minMaxChars,
} from 'Anki/utils';

export default async function persistImages(imageInfo, ImageStorage) {
  let {
    prevLineImages,
    questionImages,
    answerImages,
    expression,
  } = imageInfo;

  prevLineImages = getImageNames(prevLineImages);
  questionImages = getImageNames(questionImages);
  answerImages = getImageNames(answerImages);

  const lowerSliceIndex = prevLineImages.length;
  const upperSliceIndex = lowerSliceIndex + questionImages.length;
  const mainImageSlice = [ lowerSliceIndex, upperSliceIndex ];

  const imageProps = {
    mainImageSlice,
    mediaUrls: [],
  };

  questionAltText = formatQuestionAltText(expression);
  answerAltText = formatAnswerAltText(expression);

  const addMediaUrls = async (imageNames, altText, altTextIndex) => {
    const options = {
      folder: deck,
      use_filename: true,
      unique_filename: false,
    };

    let imageUrl = '';

    for (const img of imageNames) {
      imageUrl = await tryCatch(
        ImageStorage.upload(img, options)
      );

      if (imageProps.mediaUrls.length !== altTextIndex) {
        altText = '';
      }

      imageProps.mediaUrls.push({
        altText,
        image: imageUrl
      });
    }
  }

  await tryCatch(
    addMediaUrls(prevLineImages, prevLineAltText, 0)
  );

  await tryCatch(
    addMediaUrls(questionImages, questionAltText, prevLineImages.length)
  );

  await tryCatch(
    addMediaUrls(answerImages, answerAltText, upperSliceIndex)
  );

  return imageProps;
}

// private 

function formatAnswerAltText(expression) {
  return expression.replace(/\{\{.*?::(.+?)::.*?\}\}/g, '$1');
}

function formatQuestionAltText(expression) {
  const hint = formatHint(expression);
  const [min, max] = minMaxChars(hint);
  const minMax = min === max ? min : `${min} to ${max}`;
  const s = max > 1 ? 's' : '';
  const screenReaderHint = `(${minMax} character${s})`;
  return expression.replace(/\{\{.+?\}\}/g, screenReaderHint);
}
