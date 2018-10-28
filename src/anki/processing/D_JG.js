/* eslint-disable */

import {
  formatQuestionText,
  formatAnswerText,
  getAnswers,
  getClozes,
  splitSpeakers,
  stripHtml,
} from 'Anki/utils';

function parseDJG(contents) {
  const deck = contents.name;
  const newCards = [];

  contents.notes.forEach((card) => {
    let [
      cardId,
      expression,
      , // reading,
      , // jpMeaning,
      engMeaning,
      , // officialEng,
      , // questionImages,
      , // answerImages,
      , // audio
      , // prevLineImages,
      , // prevLineAltText,
      , // otherVisibleContext,
      altAnswers,
      , // webLookup,
      pageNum,
    ] = card.fields;

    [ engMeaning,
      expression,
    ] = [
      engMeaning,
      expression,
    ].map(stripHtml);

    if (expression.includes('B:')) {
      expression = splitSpeakers(expression);
      engMeaning = splitSpeakers(engMeaning);
    }

    const clozes = getClozes(expression);
    let answers;
    let id;

    clozes.forEach((cloze, i) => {
      id = cardId;
      if (i > 0) {
        id += i;
      }
      answers = getAnswers(cloze, altAnswers, i);
      newCards.push({
        cardId: id,
        deck,
        answers,
        answerText: formatAnswerText(engMeaning, cloze, answers, pageNum),
        questionText: formatQuestionText(engMeaning, cloze),
      });
    });
  });

  return newCards;
}

export default parseDJG;
