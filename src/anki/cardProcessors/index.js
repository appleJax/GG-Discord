import fs from 'fs';
import path from 'path';
import unzip from 'unzip-stream';
import { tryCatch } from 'Utils';
import { UPLOADS_PATH } from 'Anki/utils';
import ImageStorage from 'Config/cloudinary';
import processDJG from './D_JG';
import processIKnowCore from './iKnowCore';
import processVideoGames from './videoGames';

export function processUpload(zipfilePath) {
  return tryCatch(new Promise((resolve, reject) => {
    const stream = fs.createReadStream(zipfilePath)
      .pipe(unzip.Extract({ path: path.resolve(__dirname, 'uploads') }));

    stream.on('close', async () => {
      const files = fs.readdirSync(UPLOADS_PATH);
      const newCards = await tryCatch(
        extractCardInfo(files)
      );

      cleanUp(files);
      resolve(newCards);
    });
  }));
}

export async function processAnkiJson(filePath, storage = ImageStorage) {
  const contents = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  let cards;
  if (contents.name === 'Gamegogakuen JP') {
    cards = await tryCatch(
      processVideoGames(contents, storage)
    );
  } else if (contents.notes.length > 0) {
    cards = processDJG(contents);
  } else {
    cards = await tryCatch(
      processIKnowCore(contents, storage)
    );
  }

  return cards;
}

// private functions

async function extractCardInfo(files) {
  let allNewCards = [];
  for (const file of files) {
    const currentFile = `${UPLOADS_PATH}/${file}`;
    const stats = fs.statSync(currentFile);

    if (stats.isFile() && file.match(/.+\.json$/)) {
      const newCards = await tryCatch(
        processAnkiJson(currentFile)
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
