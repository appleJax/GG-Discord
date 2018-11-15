jest.mock('Models/Card');

import path from 'path';
import { processAnkiJson } from 'Anki/cardProcessors';

const mockStorage = {
  calls: 0,
  upload() {
    return Promise.resolve(`url#${++this.calls}`);
  }
}

beforeEach(() => {
  mockStorage.calls = 0;
});

describe('iKnowCore2000 decks', () => {
  test('it should format cards correctly', async () => {
    const file = path.resolve(__dirname, 'iKnowCore2000.json');
    const cards = await processAnkiJson(file, mockStorage);
    const firstCard = cards[0];

    let questionText1 = 'What 4 or 5 characters make the sentence roughly mean:';
    questionText1 += '\n```\nenglish```';
    questionText1 += '\n```ini\nsome[]L[][≠X,Y][?]text```';

    let answerText1 = 'Answers: CLOZE, altanswer';
    answerText1 += '\n```\nenglish```';
    answerText1 += '\n```ini\nsome[CLOZE]text```';
    answerText1 += '\nReference: Lesson 01';

    const expectedFirstCard = {
      cardId: 'id1',
      deck: 'iKnow Core 2000',
      answers: ['CLOZE', 'altanswer'],
      questionText: questionText1,
      answerText: answerText1,
      mainImageSlice: [0, 1],
      mediaUrls: [
        { 
          image: 'url#1'
        }
      ]
    };

    const secondCard = cards[1];

    let questionText2 = 'What character makes the sentence roughly mean:';
    questionText2 += '\n```\nenglish```';
    questionText2 += '\n```ini\nanother[]expression```';

    let answerText2 = 'Answer: C';
    answerText2 += '\n```\nenglish```';
    answerText2 += '\n```ini\nanother[C]expression```';
    answerText2 += '\nReference: Lesson 02';

    const expectedSecondCard = {
      cardId: 'id2',
      deck: 'iKnow Core 2000',
      answers: ['C'],
      questionText: questionText2,
      answerText: answerText2,
    };

    expect(cards.length).toBe(2);
    expect(mockStorage.calls).toEqual(1); // storage is bypassed if there is no image present
    expect(firstCard).toEqual(expectedFirstCard);
    expect(secondCard).toEqual(expectedSecondCard);
  });
});
