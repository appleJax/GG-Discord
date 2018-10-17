import fs from 'fs';
import path from 'path';
import unzip from 'unzip-stream';
import {
  formatQuestionAltText,
  formatQuestionText,
  formatAnswerAltText,
  formatAnswerText,
  getAnswers,
} from 'Anki/utils';
import { tryCatch } from 'Utils';

const UPLOADS_PATH = path.resolve(__dirname, '../uploads');


export function processUpload(zipfilePath) {
  return tryCatch(new Promise(async (resolve, reject) => {
    const stream = fs.createReadStream(zipfilePath)
      .pipe(unzip.Extract({ path: 'uploads' }));

    stream.on('close', async () => {
      const files = fs.readdirSync(UPLOADS_PATH);
      await tryCatch(optimizeImages(UPLOADS_PATH + '/media'));
      console.log('Finished optimizing images!');
      const newCards = extractCardInfo(files);

      cleanUp(files);
      resolve(newCards);
    });
  }));
}

export function optimizeImages(dirPath) {
  return tryCatch(new Promise((resolve, reject) => {
    const filesProcessing = [];
    fs.readdirSync(dirPath).forEach(file => {
      if (/.*\.png$/.test(file)) {
        const currentFile = dirPath + "/" + file;
        const contents = fs.readFileSync(currentFile);
        const writeStream = fs.createWriteStream(currentFile);
        const currentImage = tryCatch(new Promise((res, rej) =>
          writeStream.on('close', res)
        ));
        filesProcessing.push(currentImage);
        new PNG({ filterType: 4, deflateLevel: 1 })
          .parse(contents, (err, png) => {
            // Give upper left pixel an opacity
            // of 254 so Twitter won't convert
            // to jpeg
            png.data[3] -= 1;
            png.pack().pipe(writeStream);
          });
      }
    });
    Promise.all(filesProcessing).then(resolve);
  }));
}

export function parseAnkiJson(filePath) {
  const contents = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const game = contents.name;
  return contents.notes.map(card => {
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
      otherVisibleContext,
      altAnswers,
      webLookup, // use for every answer so people can look up pronunciation
                 // https://ejje.weblio.jp/content/[webLookup (e.g. 切り換える)]
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
    questionImages = getBase64(questionImages);
    prevLineImages = getBase64(prevLineImages);

    const lowerSliceIndex = prevLineImages.length;
    const upperSliceIndex = lowerSliceIndex + questionImages.length;
    const mainImageSlice = [ lowerSliceIndex, upperSliceIndex ];

    return {
      cardId,
      game,
      questionText:    formatQuestionText(cardId, engMeaning, expression, game, notes),
      questionImages,
      questionAltText: formatQuestionAltText(expression),
      prevLineImages: upperSliceIndex < 5 ? prevLineImages : [],
      prevLineAltText,
      mainImageSlice,
      answerText:      formatAnswerText(answers, cardId, engMeaning, webLookup),
      answerImages:    getBase64(answerImages),
      answerAltText:   formatAnswerAltText(expression),
      answers,
      otherVisibleContext,
      mediaUrls: []
    };
  });
}


// private functions

function extractCardInfo(files) {
  let allNewCards = [];
  for (let file of files) {
    const currentFile = `${UPLOADS_PATH}/${file}`;
    const stats = fs.statSync(currentFile);

    if (stats.isFile() && file.match(/.+\.json$/)) {
      const newCards = parseAnkiJson(currentFile);
      allNewCards = allNewCards.concat(newCards);
    }
  }
  return allNewCards;
}

function stripHtml(string) {
  return string.replace(/<.*?>|&.*?;/g, '');
}

function getImageNames(string) {
  return (string.match(/src="(.+?)"/g) || []).map(str => str.slice(5, -1));
}

function getBase64(rawString) {
  if (!rawString) return [];

  const imageNames = getImageNames(rawString);
  let base64Images;
  try {
    base64Images = imageNames.map(
      (imageName) =>
        fs.readFileSync(
          `${UPLOADS_PATH}/media/${imageName}`,
          { encoding: 'base64' }
        )
    );
  } catch (e) {
    console.error(e);
    // return undefined...
  }
  return base64Images;
}

function cleanUp(files) {
  for (let file of files) {
    const root = `${UPLOADS_PATH}/${file}`;

    if (fs.lstatSync(root).isFile())
      fs.unlinkSync(root);
    else if (fs.lstatSync(root).isDirectory())
      deleteFolderRecursive(root);
  }
}

function deleteFolderRecursive(rootPath) {
  if (fs.existsSync(rootPath)) {
    fs.readdirSync(rootPath).forEach(file => {
      const curPath = rootPath + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(rootPath);
  }
};
