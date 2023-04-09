import fs from "node:fs";
import path from "node:path";
import unzip from "unzip-stream";
import { tryCatch } from "Utils";
import { UPLOADS_PATH } from "Anki/utils";
import ImageStorage from "Config/cloudinary";
import processDJG from "./D_JG";
import processIKnowCore from "./iKnowCore";
import processVideoGamesJP from "./videoGames/jp";
// import processVideoGamesEN from "./videoGames/en";

export function processUpload(zipfilePath) {
  return tryCatch(
    new Promise((resolve) => {
      const stream = fs
        .createReadStream(zipfilePath)
        .pipe(unzip.Extract({ path: path.resolve(__dirname, "uploads") }));

      stream.on("close", async () => {
        const files = fs.readdirSync(UPLOADS_PATH);
        const newCards = await tryCatch(extractCardInfo(files));

        cleanUp(files);
        resolve(newCards);
      });
    })
  );
}

export async function processAnkiJson(contents, storage = ImageStorage) {
  const allNewCards = [];

  for (const deck of contents.children) {
    for (const subDeck of deck.children) {
      let newCards = [];
      switch (deck.name) {
        case "iKnow Core Series":
          newCards = await tryCatch(processIKnowCore(subDeck, storage));
          break;
        case "Japanese Grammar Dictionaries":
          newCards = await tryCatch(processDJG(subDeck, storage));
          break;
        case "Video Games":
          newCards = await tryCatch(processVideoGamesJP(subDeck, storage));
          break;
      }
      allNewCards.push(...newCards);
    }
  }

  return allNewCards;
}

async function extractCardInfo(files) {
  let allNewCards = [];
  for (const file of files) {
    const currentFile = `${UPLOADS_PATH}/${file}`;
    const stats = fs.statSync(currentFile);

    if (stats.isFile() && file.match(/.+\.json$/)) {
      const contents = JSON.parse(fs.readFileSync(currentFile, "utf8"));
      const newCards = await tryCatch(processAnkiJson(contents));
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
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(rootPath);
  }
}
