export function formatAnswerText(answers, engMeaning) {
  const s = answers.length > 1 ? 's' : '';
  let answerText = `Answer${s}: ${answers.join(', ')}`;
  answerText += `\nEnglish: "${engMeaning}"`;

  return answerText;
}

export function formatQuestionText(
  engMeaning,
  expression,
  game,
  notes,
) {
  const hint = formatHint(expression);
  const [min, max] = minMaxChars(hint);
  const minMax = min === max ? min : `${min}-${max}`;
  let tweetText = `What ${minMax} character answer means "${engMeaning}"?`;

  if (needsHint(hint)) {
    tweetText += `\nHint: ${hint}`;
  }

  if (notes) {
    tweetText += `\nNotes: ${notes}`;
  }

  tweetText += `\nGame: ${game.replace(/\s(ENG|JP)$/, '')}`;

  return tweetText;
}

export function getAnswers(expression, altAnswers) {
  const acceptedAnswer = expression.match(/::(.+?)::/)[1];
  let otherAnswers = [];
  if (altAnswers && altAnswers.length > 0) {
    otherAnswers = altAnswers.split(',');
  }

  return [acceptedAnswer].concat(otherAnswers);
}

// private functions

function flatten(deep, flat = []) {
  if (deep.length === 0) { return flat; }

  const [head, ...tail] = deep;
  return scalar(head)
    ? flatten(tail, flat.concat(head))
    : flatten(tail, flat.concat(flatten(head)));
}

function formatHint(expression) {
  const legend = expression.match(/::.+?::(.+?)\}\}/)[1];
  const normalized = groupMultiXs(groupXs(groupQuestionMarks(legend)));

  return flatten(split(normalized)).map((group) => {
    if (group === '.') { return '[_]'; }

    if (group === '-') { return '[_] [_] [_] [_] [_]'; }

    if (/\?/.test(group)) {
      const result = [];
      const numChars = Number(group.match(/\d+/)[0]);
      for (let i = 0; i < numChars; i++) {
        result.push('[?]');
      }

      if (result.length === 1) {
        return '[?]';
      }

      return `(${result.join(' ')})`;
    }

    if (/[≠x]/.test(group)) {
      const negatedChars = group.replace(/[≠x]/g, '');
      return `[≠${negatedChars}]`;
    }
    // else (character gimme)
    return group;
  }).join(' ');
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
  return hint.match(/([^\s]+)/g).length;
}

function minChars(hint) {
  const optionalChars = (hint.match(/\?/g) || []).length;
  return maxChars(hint) - optionalChars;
}

function minMaxChars(hint) {
  return [minChars(hint), maxChars(hint)];
}

function needsHint(hint) {
  return hint.replace(/\[_\]/g, '').trim().length !== 0;
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
