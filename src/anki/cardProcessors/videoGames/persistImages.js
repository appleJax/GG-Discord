import {
  formatHint,
  getImageNames,
  minMaxChars,
} from 'Anki/utils';

export default function persistImages(ImageStorage, imageInfo) {
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

  const options = {
    folder: deck,
    use_filename: true,
    unique_filename: false,
  };

  questionAltText = formatQuestionAltText(expression);
  answerAltText = formatAnswerAltText(expression);

  let altText = '';
  let imageUrl = '';

  for (const img of prevLineImages) {
    imageUrl = await tryCatch(
      ImageStorage.upload(img, options)
    );

    altText = mediaUrls.length === 0
      ? prevLineAltText
      : '';

    imageProps.mediaUrls.push({
      altText,
      image: imageUrl
    });
  }

  for (const img of questionImages) {
    imageUrl = await tryCatch(
      ImageStorage.upload(img, options)
    );

    altText = (mediaUrls.length === prevLineImages.length)
      ? questionAltText
      : '';

    imageProps.mediaUrls.push({
      altText,
      image: imageUrl
    });
  }

  for (const img of answerImages) {
    imageUrl = await tryCatch(
      ImageStorage.upload(img, options)
    );

    altText = (mediaUrls.length === upperSliceIndex)
      ? answerAltText
      : '';

    imageProps.mediaUrls.push({
      altText,
      image: imageUrl
    });
  }

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
