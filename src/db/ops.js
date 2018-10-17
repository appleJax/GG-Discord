import { processUpload } from 'Anki/processing';
import { tryCatch } from 'Utils';
import Models from 'Models';

const { Card } = Models;

export default ({

  async addDeck(req, res) {
    const filePath = req.file.path;
    const newCards = await tryCatch(processUpload(filePath));

    const ops = [];
    for (let i = 0; i < newCards.length; ++i) {
      const newCard = newCards[i];
      const { cardId } = newCard;
      ops.push({
        replaceOne: {
            filter: { cardId },
            replacement: newCard,
            upsert: true
        }
      });
    }

    if (ops.length === 0)
      return;

    await tryCatch(Card.bulkWrite(ops));
    console.log('Finished uploading/updating cards!');
  },

});
