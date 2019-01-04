/* eslint-disable camelcase */
import { processAnkiJson } from 'Anki/cardProcessors';
import DJG_multipleCloze from './DJG_multipleCloze';
import DJG_singleCloze from './DJG_singleCloze';

jest.mock('Models/Card');

describe('it should produce the correct cards for the DB*G decks', () => {
  test('single cloze', async () => {
    const cards = await processAnkiJson(DJG_singleCloze);
    const firstCard = cards[0];

    let questionText = 'What 5 characters make the sentence roughly mean:';
    questionText += '\n```\nenglish```';
    questionText += '\n```ini\nsome[][][][≠X,Y][]text```';

    let answerText = 'Answers: CLOZE, altanswer';
    answerText += '\n```\nenglish```';
    answerText += '\n```ini\nsome[CLOZE]text```';
    answerText += '\nReference: pg1';

    const expectedCard = {
      cardId: 'id',
      deck: 'DIJG',
      answers: ['CLOZE', 'altanswer'],
      questionText,
      answerText,
    };

    expect(cards.length).toBe(1);
    expect(firstCard).toEqual(expectedCard);
  });

  test('multiple clozes', async () => {
    const cards = await processAnkiJson(DJG_multipleCloze);
    const firstCard = cards[0];

    let questionText1 = 'What character makes the sentence roughly mean:';
    questionText1 += '\n```\nenglish```';
    questionText1 += '\n```ini\nOne[≠A]TwoC2TwoC2ThreeC3Four```';

    let answerText1 = 'Answer: C';
    answerText1 += '\n```\nenglish```';
    answerText1 += '\n```ini\nOne[C]TwoC2TwoC2ThreeC3Four```';
    answerText1 += '\nReference: pg1';

    const expectedFirstCard = {
      cardId: 'id',
      deck: 'DIJG',
      answers: ['C'],
      questionText: questionText1,
      answerText: answerText1,
    };

    const secondCard = cards[1];

    let questionText2 = 'What 1 or 2 characters make the sentence roughly mean:';
    questionText2 += '\n```\nenglish```';
    questionText2 += '\n```ini\nOneCTwo[][?]Two[][?]ThreeC3Four```';

    let answerText2 = 'Answers: C2, c2Alt';
    answerText2 += '\n```\nenglish```';
    answerText2 += '\n```ini\nOneCTwo[C2]Two[C2]ThreeC3Four```';
    answerText2 += '\nReference: pg1';

    const expectedSecondCard = {
      cardId: 'id1',
      deck: 'DIJG',
      answers: ['C2', 'c2Alt'],
      questionText: questionText2,
      answerText: answerText2,
    };

    const thirdCard = cards[2];

    let questionText3 = 'What 2 characters make the sentence roughly mean:';
    questionText3 += '\n```\nenglish```';
    questionText3 += '\n```ini\nOneCTwoC2TwoC2Three[]3Four```';

    let answerText3 = 'Answers: C3, c3Alt1, c3Alt2';
    answerText3 += '\n```\nenglish```';
    answerText3 += '\n```ini\nOneCTwoC2TwoC2Three[C3]Four```';
    answerText3 += '\nReference: pg1';

    const expectedThirdCard = {
      cardId: 'id2',
      deck: 'DIJG',
      answers: ['C3', 'c3Alt1', 'c3Alt2'],
      questionText: questionText3,
      answerText: answerText3,
    };

    expect(cards.length).toBe(3);
    expect(firstCard).toEqual(expectedFirstCard);
    expect(secondCard).toEqual(expectedSecondCard);
    expect(thirdCard).toEqual(expectedThirdCard);
  });
});
