export function formatAnswerText(engMeaning, expression, pageNum) {
  const answers = getAnswers(expression);
  const s = answers.length > 1 ? 's' : '';

  let answerText = `Answer${s}: ${answers.join(', ')}`;
  answerText += `\n${'```'}\n${engMeaning}${'```'}`;
  answerText += `\n${'```ini'}\n${fillAnswer(expression, answers[0])}${'```'}`;
  answerText += `\nReference: ${pageNum}`;

  return answerText;
}

export function formatQuestionText(engMeaning, expression) {
  const hint = formatHint(expression);
  const japaneseWithHint = expression.replace(/{{.+?}}/, hint);

  const [min, max] = minMaxChars(hint);
  let minMax = min === max ? min : `${min}-${max}`;
  let s = 's';

  if (minMax === 1) {
    minMax = '';
    s = '';
  } else {
    minMax += ' ';
  }

  let questionText = `Fill in the missing ${minMax}character${s} to make the sentence roughly mean:`;
  questionText += `\n${'```'}\n${engMeaning}${'```'}`;
  questionText += `\n${'```ini'}\n${japaneseWithHint}${'```'}`;

  return questionText;
}

export function getAnswers(expression, altAnswers) {
  const officialAnswer = expression.match(/::(.+?)::/)[1];

  let otherAnswers = [];
  if (altAnswers && altAnswers.length > 0) {
    otherAnswers = altAnswers.split(',');
  }

  return [officialAnswer].concat(otherAnswers);
}

export function getClozes(expression) {
  return expression.match(/{{.+?}}/g).map((cloze, i, allClozes) => {
    const clozesToReplace = allClozes.slice(0, i).concat(allClozes.slice(i + 1));

    let newExpression = expression;
    let answer;

    clozesToReplace.forEach((singleCloze) => {
      answer = getAnswer(singleCloze);
      newExpression = newExpression.replace(singleCloze, answer);
    });

    return newExpression;
  });
}

export function splitSpeakers(phrase) {
  return phrase.replace('B:', '\nB:');
}

// private functions

function fillAnswer(expression, answer) {
  return expression.replace(/{{.+?}}/, `[${answer}]`);
}

function flatten(deep, flat = []) {
  if (deep.length === 0) { return flat; }

  const [head, ...tail] = deep;
  return scalar(head)
    ? flatten(tail, flat.concat(head))
    : flatten(tail, flat.concat(flatten(head)));
}

function formatHint(expression) {
  const legend = expression.match(/::.+?::(.+?)}}/)[1];
  const normalized = groupMultiXs(groupXs(groupQuestionMarks(legend)));

  const hint = flatten(split(normalized)).map((group) => {
    if (group === '.') {
      return '[]';
    }

    if (group === '-') {
      return '[][][][][]';
    }

    if (/\?/.test(group)) {
      const result = [];
      const numChars = Number(group.match(/\d+/)[0]);
      for (let i = 0; i < numChars; i++) {
        result.push('[?]');
      }

      if (result.length === 1) {
        return '[?]';
      }

      return `(${result.join('')})`;
    }

    if (/[≠x]/.test(group)) {
      const negatedChars = group.replace(/[≠x]/g, '');
      return `[≠${negatedChars}]`;
    }
    // else (character gimme)
    return group;
  });

  return hint.join('');
}

function groupMultiXs(string) {
  return string.replace(/[≠x]\((.*?)\)/g, '(≠$1)');
}

function groupQuestionMarks(string) {
  return string.replace(/(\?+)/g, (match, p1) => `(${p1.length}?)`);
}

function groupXs(string) {
  return string.replace(/[≠x][^(]/g, '($&)');
}

function maxChars(hint) {
  return hint.match(/\[.*?\]/g).length;
}

function minChars(hint) {
  const optionalChars = (hint.match(/\?/g) || []).length;
  return maxChars(hint) - optionalChars;
}

function minMaxChars(hint) {
  return [minChars(hint), maxChars(hint)];
}

function split(str) {
  return str.split(/[()]/)
    .map(group => (/\?|≠|x/.test(group)
      ? group
      : group.split('')));
}

function scalar(v) {
  return !Array.isArray(v);
}
