/* eslint-disable */
import fs from 'fs';
import path from 'path';
import unzip from 'unzip-stream';
import { tryCatch } from 'Utils';
import { UPLOADS_PATH } from 'Anki/utils';
import parseDJG from './D_JG';
import parseIKnowCore from './iKnowCore';

export function processUpload(zipfilePath) {
  return tryCatch(new Promise((resolve, reject) => {
    const stream = fs.createReadStream(zipfilePath)
      .pipe(unzip.Extract({ path: path.resolve(__dirname, 'uploads') }));

    stream.on('close', async () => {
      const files = fs.readdirSync(UPLOADS_PATH);
      console.log('Extracting Card Info...');
      const newCards = await tryCatch(
        extractCardInfo(files)
      );
      console.log('Cards processed:', newCards.length);

      cleanUp(files);
      resolve(newCards);
    });
  }));
}

export async function parseAnkiJson(filePath) {
  const contents = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  let cards;
  if (contents.notes.length > 0) {
    console.log('Parsing DJG...');
    cards = parseDJG(contents);
  } else {
    console.log('Parsing I Know Core...');
    cards = await tryCatch(
      parseIKnowCore(contents)
    );
  }
  console.log('Done parsing...');

  return cards;
}

// private functions

async function extractCardInfo(files) {
  let allNewCards = [];
  for (const file of files) {
    const currentFile = `${UPLOADS_PATH}/${file}`;
    const stats = fs.statSync(currentFile);

    if (stats.isFile() && file.match(/.+\.json$/)) {
      console.log('Parsing anki JSON...');
      const newCards = await tryCatch(
        parseAnkiJson(currentFile)
      );
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
