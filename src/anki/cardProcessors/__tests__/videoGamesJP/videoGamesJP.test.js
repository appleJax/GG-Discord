import path from "node:path";
import { processAnkiJson } from "Anki/cardProcessors";
import videoGamesJP from "./videoGamesJP.json";

jest.mock("Models/Card");

const mockStorage = {
  calls: 0,
  upload(imageName) {
    this.calls++;
    const baseName = path.basename(imageName);
    return Promise.resolve(`url/${baseName}`);
  },
};

beforeEach(() => {
  mockStorage.calls = 0;
});

describe("videoGame decks", () => {
  test("it should format cards correctly", async () => {
    const cards = await processAnkiJson(videoGamesJP, mockStorage);
    const card = cards[0];

    let questionText = 'What 4 or 5 character answer means "english"?';
    questionText += "\nNotes: notes";
    questionText += "\nGame: Game #1";

    let answerText = "答え: CLOZE, altAnswer1, altAnswer2";
    answerText += '\n英語: "english"';
    answerText += "\n辞典: https://ejje.weblio.jp/content/webLookup";

    const expectedCard = {
      cardId: "id1",
      deck: "Gamegogakuen JP",
      game: "Game #1",
      answers: ["CLOZE", "altAnswer1", "altAnswer2"],
      questionText,
      answerText,
      mainImageSlice: [1, 2],
      mediaUrls: [
        {
          altText: "prevLineAltText",
          image: "url/prevLineImage.png",
        },
        {
          altText: "```ini\nsome[?][]O[][≠A,I]other[?][]O[][≠A,I]text```",
          image: "url/questionImage.png",
        },
        {
          altText: "```ini\nsome[CLOZE]other[CLOZE]text```",
          image: "url/answerImage.png",
        },
      ],
    };

    expect(mockStorage.calls).toEqual(3);
    expect(card).toEqual(expectedCard);
  });
});
