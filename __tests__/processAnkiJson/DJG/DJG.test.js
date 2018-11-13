/* eslist-disable */

import path from 'path';
import { processAnkiJson } from 'Anki/cardProcessors';

describe('it should produce the correct cards for the DB*G decks', () => {
  test('single cloze', async () => {
    const file = path.resolve(__dirname, 'DJG_singleCloze.json');
    const cards = await processAnkiJson(file);
    const firstCard = cards[0];

    let questionText = 'Fill in the missing 5 characters to make the sentence roughly mean:';
    questionText += '\n```\nenglish```';
    questionText += '\n```ini\nsome[][][][≠X,Y][]text```';

    let answerText = 'Answers: CLOZE, altanswer';
    answerText += '\n```\nenglish```';
    answerText += '\n```ini\nsome[CLOZE]text```';
    answerText += '\nReference: pg1';

    const expectedCard = {
      cardId: 'id',
      deck: 'DIJG-SingleCloze',
      answers: ['CLOZE', 'altanswer'],
      questionText,
      answerText,
    };

    expect(cards.length).toBe(1);
    expect(firstCard).toEqual(expectedCard);
  });

  test('multiple clozes', () => {
    const file = path.resolve(__dirname, 'DJG_multipleCloze.json');
    const cards = processAnkiJson(file);
    const firstCard = cards[0];

    let questionText1 = 'Fill in the missing character to make the sentence roughly mean:';
    questionText1 += '\n```\nenglish```';
    questionText1 += '\n```ini\nOne[≠A]TwoC2ThreeC3Four```';

    let answerText1 = 'Answer: C';
    answerText1 += '\n```\nenglish```';
    answerText1 += '\n```ini\nOne[C]TwoC2ThreeC3Four```';
    answerText1 += '\nReference: pg1';

    const expectedFirstCard = {
      cardId: 'id',
      deck: 'DIJG-MultipleCloze',
      answers: ['C'],
      questionText: questionText1,
      answerText: answerText1,
    };

    const thirdCard = cards[2];

    let questionText3 = 'Fill in the missing 1-2 characters to make the sentence roughly mean:';
    questionText3 += '\n```\nenglish```';
    questionText3 += '\n```ini\nOneCTwoC2Three[][?]Four```';

    let answerText3 = 'Answers: C3, c3Alt1, c3Alt2';
    answerText3 += '\n```\nenglish```';
    answerText3 += '\n```ini\nOneCTwoC2Three[C3]Four```';
    answerText3 += '\nReference: pg1';

    const expectedThirdCard = {
      cardId: 'id2',
      deck: 'DIJG-MultipleCloze',
      answers: ['C3', 'c3Alt1', 'c3Alt2'],
      questionText: questionText3,
      answerText: answerText3,
    };

    expect(cards.length).toBe(3);
    expect(firstCard).toEqual(expectedFirstCard);
    expect(thirdCard).toEqual(expectedThirdCard);
  });
});
