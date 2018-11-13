// jest.mock('Models/Card');

import path from 'path';
import { processAnkiJson } from 'Anki/cardProcessors';
// import { Card } from 'Models/Card';

let i;
const mockStorage = {
  upload() {
    return Promise.resolve(`url#${++i}`);
  }
}

beforeEach(() => {

});

// afterEach(() => {
//   Card.remove();
// });

describe('iKnowCore2000 decks', () => {
  test('it should format cards correctly', () => {
    const file = path.resolve(__dirname, 'iKnowCore2000.json');
    const cards = processAnkiJson(file, mockStorage);
    const firstCard = cards[0];

    let questionText1 = 'Fill in the missing 4-5 characters to make the sentence roughly mean:';
    questionText1 += '\n```\nenglish```';
    questionText1 += '\n```ini\nsome[][][][≠X,Y][?]text```';

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
          altText: '',
          image: 'url#1'
        }
      ]
    };

    const secondCard = cards[1];

    let questionText2 = 'Fill in the missing character to make the sentence roughly mean:';
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
    expect(firstCard).toEqual(expectedFirstCard);
    expect(secondCard).toEqual(expectedSecondCard);
  });
});
