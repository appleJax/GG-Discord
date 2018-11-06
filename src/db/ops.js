import { processUpload } from 'Anki/processing';
import { tryCatch } from 'Utils';
import Card from 'Models/Card';

export default ({
  async addDeck(req, res) {
    const filePath = req.file.path;
    console.log('Starting to process...');
    const newCards = await tryCatch(processUpload(filePath));
    console.log('Finished processing');

    const ops = [];
    for (const newCard of newCards) {
      const { cardId } = newCard;
      ops.push({
        replaceOne: {
          filter: { cardId },
          replacement: newCard,
          upsert: true,
        },
      });
    }

    if (ops.length === 0) {
      return;
    }

    await tryCatch(Card.bulkWrite(ops));
    console.log('Finished uploading/updating cards!');
  },
});
