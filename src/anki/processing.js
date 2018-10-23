/* eslint-disable */

import fs from 'fs';
import path from 'path';
import unzip from 'unzip-stream';
import {
  formatQuestionText,
  formatAnswerText,
  getAnswers,
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

  contents.children.forEach((deck) => {
    const game = deck.name;
    deck.notes.forEach((card) => {
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
        altAnswers,
        , // webLookup, // use for every answer so people can look up pronunciation
                  // https://ejje.weblio.jp/content/[webLookup (e.g. 切り換える)]
        notes,
      ] = card.fields;

      [ altAnswers,
        engMeaning,
        expression,
        notes,
      ] = [
        altAnswers,
        engMeaning,
        expression,
        notes,
      ].map(stripHtml);

      engMeaning = engMeaning.replace(/"/g, "'");
      const answers = getAnswers(expression, altAnswers);

      newCards.push({
        cardId,
        game,
        questionText: formatQuestionText(engMeaning, expression, game, notes),
        answerText: formatAnswerText(answers, engMeaning),
        answers,
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
