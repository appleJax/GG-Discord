import path from 'path';

export const UPLOADS_PATH = path.resolve(__dirname, 'uploads');

export function formatAnswerText(engMeaning, expression, answers, ref) {
  const s = answers.length > 1 ? 's' : '';

  let answerText = `Answer${s}: ${answers.join(', ')}`;
  answerText += `\n${'```'}\n${engMeaning}${'```'}`;
  answerText += `\n${'```ini'}\n${fillAnswer(expression, answers[0])}${'```'}`;
  answerText += `\nReference: ${ref}`;

  return answerText;
}

export function formatHint(expression) {
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

export function formatQuestionText(engMeaning, expression) {
  const hint = formatHint(expression);
  const japaneseWithHint = expression.replace(/{{.+?}}/g, hint);

  const [min, max] = minMaxChars(hint);
  let minMax = min === max ? min : `${min} or ${max}`;
  let s1 = 's';
  let s2 = '';

  if (minMax === 1) {
    minMax = '';
    [s1, s2] = [s2, s1];
  } else {
    minMax += ' ';
  }

  let questionText = `What ${minMax}character${s1} make${s2} the sentence roughly mean:`;
  questionText += `\n${'```'}\n${engMeaning}${'```'}`;
  questionText += `\n${'```ini'}\n${japaneseWithHint}${'```'}`;

  return questionText;
}

export function getAnswers(expression, altAnswers, i) {
  const officialAnswer = expression.match(/::(.+?)::/)[1];
  let otherAnswers = [];

  if (altAnswers) {
    otherAnswers = altAnswers
      .replace(/\s+/g, '')
      .split('::')[i || 0];

    if (otherAnswers) {
      otherAnswers = otherAnswers.split(',');
    }
  }

  return [officialAnswer].concat(otherAnswers).filter(Boolean);
}

export function getImageNames(string) {
  return (string.match(/src="(.+?)"/g) || [])
    .map(str => str.slice(5, -1))
    .map(fileName => `${UPLOADS_PATH}/media/${fileName}`);
}

export function getClozes(expression) {
  const rawClozes = expression.match(/{{.+?}}/g);
  const uniqueClozes = [];
  rawClozes.forEach(cloze => {
    if (!uniqueClozes.includes(cloze)) {
      uniqueClozes.push(cloze);
    }
  });

  return uniqueClozes.map((cloze, i, allClozes) => {
    const clozesToReplace = allClozes.slice(0, i).concat(allClozes.slice(i + 1));

    let tempExpression = expression;
    let newExpression = expression;
    let answer;

    clozesToReplace.forEach((singleCloze) => {
      [answer] = getAnswers(singleCloze);

      tempExpression = newExpression.replace(singleCloze, answer);
      while (tempExpression !== newExpression) {
        newExpression = tempExpression;
        tempExpression = newExpression.replace(singleCloze, answer);
      }
    });

    return newExpression;
  });
}

export function minMaxChars(hint) {
  return [minChars(hint), maxChars(hint)];
}

export function splitBrackets(phrase) {
  return phrase.replace(/\]/g, ']\n');
}

export function splitSpeakers(phrase) {
  return phrase.replace(/(.)([AB]:)/g, '$1\n$2');
}

export function stripHtml(string) {
  return string.replace(/<.*?>|&.*?;/g, '');
}

// private functions

function fillAnswer(expression, answer) {
  return expression.replace(/{{.+?}}/g, `[${answer}]`);
}

function flatten(deep, flat = []) {
  if (deep.length === 0) { return flat; }

  const [head, ...tail] = deep;
  return scalar(head)
    ? flatten(tail, flat.concat(head))
    : flatten(tail, flat.concat(flatten(head)));
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
  return hint
    .replace(/\[.*?\]/g, 'C')
    .replace(/[)(]/g, '')
    .length;
}

function minChars(hint) {
  const optionalChars = (hint.match(/\?/g) || []).length;
  return maxChars(hint) - optionalChars;
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
