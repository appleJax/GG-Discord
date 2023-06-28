/* eslint-disable prefer-const */

import { getImageNames } from "Anki/utils";

export default async function persistImages(imageInfo, ImageStorage) {
  let {
    prevLineAltText,
    prevLineImages,
    questionImages,
    answerImages,
    expression,
    hint,
    game,
  } = imageInfo;

  prevLineImages = getImageNames(prevLineImages);
  questionImages = getImageNames(questionImages);
  answerImages = getImageNames(answerImages);

  const lowerSliceIndex = prevLineImages.length;
  const upperSliceIndex = lowerSliceIndex + questionImages.length;
  const mainImageSlice = [lowerSliceIndex, upperSliceIndex];

  const imageProps = {
    mainImageSlice,
    mediaUrls: [],
  };

  const questionAltText = formatQuestionAltText(expression, hint);
  const answerAltText = formatAnswerAltText(expression);

  const addMediaUrls = async (imageNames, altText, altTextIndex) => {
    const options = {
      folder: game,
      use_filename: true,
      unique_filename: false,
    };

    let imageUrl = "";

    for (const img of imageNames) {
      imageUrl = await ImageStorage.upload(img, options);

      if (imageProps.mediaUrls.length !== altTextIndex) {
        altText = "";
      }

      imageProps.mediaUrls.push({
        altText,
        image: imageUrl,
      });
    }
  };

  await addMediaUrls(prevLineImages, prevLineAltText, 0);
  await addMediaUrls(questionImages, questionAltText, prevLineImages.length);
  await addMediaUrls(answerImages, answerAltText, upperSliceIndex);

  return imageProps;
}

// private

function formatAnswerAltText(expression) {
  const altText = expression.replace(/\{\{.*?::(.+?)::.*?\}\}/g, "[$1]");
  return `${"```"}ini\n${altText}${"```"}`;
}

function formatQuestionAltText(expression, hint) {
  const altText = expression.replace(/\{\{.+?\}\}/g, hint);
  return `${"```"}ini\n${altText}${"```"}`;
}
