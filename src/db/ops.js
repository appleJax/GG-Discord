import "core-js/stable";
import regeneratorRuntime from "regenerator-runtime/runtime";
import { v4 as uuid } from "uuid";
import { processUpload } from "Anki/cardProcessors";
import { tryCatch } from "Utils";
import { Card } from "Models";

const QUEUE = {};

export default {
  async addDeck(req, res) {
    const taskId = uuid();
    QUEUE[taskId] = "processing";
    res.set("Location", `/queue/${taskId}`);
    res.status(202).json({ taskStatus: `/queue/${taskId}` });

    const filePath = req.file.path;
    const newCards = await tryCatch(processUpload(filePath));

    const ops = [];
    newCards.forEach((newCard) => {
      const { cardId } = newCard;
      ops.push({
        replaceOne: {
          filter: { cardId },
          replacement: newCard,
          upsert: true,
        },
      });
    });

    if (ops.length === 0) {
      return;
    }

    await tryCatch(Card.bulkWrite(ops));
    console.log("Finished uploading/updating cards!");
    QUEUE[taskId] = "success";
  },

  queueStatus(req, res) {
    const { taskId } = req.params;
    let status = QUEUE[taskId];
    let message = "";

    switch (status) {
      case "success":
        delete QUEUE[taskId];
        message = "Deck uploaded successfully!";
        break;
      case "error":
        delete QUEUE[taskId];
        message = "ERROR: Something went wrong. Please try again.";
        break;
      case "processing":
        message = "Check back later.";
        break;
      default:
        status = "warning";
        message = "Task not found.";
        break;
    }

    res.json({ status, message });
  },
};
