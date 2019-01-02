import path from 'path';
import { processAnkiJson } from 'Anki/cardProcessors';

jest.mock('Models/Card');

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

describe('videoGame decks', () => {
  test('it should format cards correctly', async () => {
    const file = path.resolve(__dirname, 'videoGamesEN.json');
    const cards = await processAnkiJson(file, mockStorage);
    const card = cards[0];

    let questionText = 'どの(3)つの言葉に分けられた(8 or 9)文字で「(japanese)」のような意味合いになりますか？';
    questionText += '\nNotes: notes';
    questionText += '\nGame: Game #1';

    let answerText = 'Answers: to the test, altAnswer1, altAnswer2';
    answerText += '\nJapanese: 「japanese」';
    answerText += '\nWeblookup: https://ejje.weblio.jp/content/web%20lookup';

    const expectedCard = {
      cardId: 'id1',
      deck: 'Gamegogakuen EN',
      game: 'Game #1',
      answers: ['to the test', 'altAnswer1', 'altAnswer2'],
      questionText,
      answerText,
      mainImageSlice: [1, 2],
      mediaUrls: [
        {
          altText: 'prevLineAltText',
          image: 'url/prevLineImage.png',
        },
        {
          altText: "```ini\nIt's time to put your training [2][3][.≠i?.]!```",
          image: 'url/questionImage.png',
        },
        {
          altText: "```ini\nIt's time to put your training [to the test]!```",
          image: 'url/answerImage.png',
        },
      ],
    };

    expect(mockStorage.calls).toEqual(3);
    expect(card).toEqual(expectedCard);
  });
});
