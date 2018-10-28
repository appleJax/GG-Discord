/* eslint-disable */

import fs from 'fs';
import path from 'path';
import unzip from 'unzip-stream';
import { tryCatch } from 'Utils';
import parseDJG from './D_JG';
import parseIKnowCore from './iKnowCore';

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

  return (contents.notes.length > 0)
    ? parseDJG(contents)
    : parseIKnowCore(contents);
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
