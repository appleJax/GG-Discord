/* eslint-disable */

import fs from 'fs';
import path from 'path';
import unzip from 'unzip-stream';
import {
  formatQuestionText,
  formatAnswerText,
  getClozes,
} from 'Anki/utils';
import { tryCatch } from 'Utils';

const UPLOADS_PATH = path.resolve(__dirname, '../../uploads');

export function processUpload(zipfilePath) {
  return tryCatch(new Promise(async (resolve, reject) => {
    const stream = fs.createReadStream(zipfilePath)
      .pipe(unzip.Extract({ path: 'uploads' }));

    stream.on('close', async () => {
      const files = fs.readdirSync(UPLOADS_PATH);
      const newCards = extractCardInfo(files);

      cleanUp(files);
      resolve(newCards);
    });
  }));
}

export function parseAnkiJson(filePath) {
  const contents = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const newCards = [];

  const deck = contents.name;
  contents.notes.forEach((card) => {
    let [
      cardId,
      expression,
      , // reading,
      , // jpMeaning,
      engMeaning,
      , // officialEng,
      , // questionImages,
      , // answerImages,
      , // audio
      , // prevLineImages,
      , // prevLineAltText,
      , // otherVisibleContext,
      , // altAnswers,
      , // webLookup,
      pageNum,
    ] = card.fields;

    [ engMeaning,
      expression,
    ] = [
      engMeaning,
      expression,
    ].map(stripHtml);

    engMeaning = engMeaning.replace(/"/g, "'");
    const clozes = getClozes(expression);

    clozes.forEach((cloze, i) => {
      if (i > 0) {
        cardId += i;
      }
      newCards.push({
        cardId,
        deck,
        answerText: formatAnswerText(engMeaning, expression),
        questionText: formatQuestionText(engMeaning, expression),
      });
    });
  });

  return newCards;
}

// private functions

function extractCardInfo(files) {
  let allNewCards = [];
  for (const file of files) {
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

function cleanUp(files) {
  for (const file of files) {
    const root = `${UPLOADS_PATH}/${file}`;

    if (fs.lstatSync(root).isFile()) {
      fs.unlinkSync(root);
    } else if (fs.lstatSync(root).isDirectory()) {
      deleteFolderRecursive(root);
    }
  }
}

function deleteFolderRecursive(rootPath) {
  if (fs.existsSync(rootPath)) {
    fs.readdirSync(rootPath).forEach((file) => {
      const curPath = `${rootPath}/${file}`;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(rootPath);
  }
}
