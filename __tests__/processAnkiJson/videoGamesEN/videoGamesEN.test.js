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
  xtest('it should format cards correctly', async () => {
    const file = path.resolve(__dirname, 'videoGamesEN.json');
    const cards = await processAnkiJson(file, mockStorage);
    const card = cards[0];

    let questionText = 'What 3 words ([5] [5] [7]) mean "japanese"?';
    questionText += '\nNotes: notes';
    questionText += '\nGame: Game #1';

    let answerText = '答え: three words missing, altAnswer1, altAnswer2';
    answerText += '\n英語: "japanese"';
    answerText += '\n辞典: https://ejje.weblio.jp/content/web%20lookup';

    const expectedCard = {
      cardId: 'id1',
      deck: 'Gamegogakuen EN',
      game: 'Game #1',
      answers: ['three words missing', 'altAnswer1', 'altAnswer2'],
      questionText,
      answerText,
      mainImageSlice: [1, 2],
      mediaUrls: [
        {
          altText: 'prevLineAltText',
          image: 'url/prevLineImage.png',
        },
        {
          altText: '```ini\nsome[?][]O[][≠A,I]other[?][]O[][≠A,I]text```',
          image: 'url/questionImage.png',
        },
        {
          altText: '```ini\nsome[CLOZE]other[CLOZE]text```',
          image: 'url/answerImage.png',
        },
      ],
    };

    expect(mockStorage.calls).toEqual(3);
    expect(card).toEqual(expectedCard);
  });
});
