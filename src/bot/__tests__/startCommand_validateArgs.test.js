import {
  QUIZ_SIZE,
  SECONDS_PER_QUESTION,
  validateArgs,
} from 'Bot/commands/start';

describe('validating arguments for start command', () => {
  it('should return the default values if no args are present', () => {
    const argResult = validateArgs([]);
    const expectedArgs = {
      quizSize: QUIZ_SIZE.default,
      secondsPerQuestion: SECONDS_PER_QUESTION.default,
    };

    expect(argResult).toEqual(expectedArgs);
    expect(argResult.error).toBeUndefined();
  });

  it('should return the correct values if given valid arguments', () => {
    const quizSize = 12;
    const secondsPerQuestion = 70;

    const argResult = validateArgs([quizSize, secondsPerQuestion]);
    const expectedArgs = {
      quizSize: 12,
      secondsPerQuestion: 70,
    };

    expect(argResult).toEqual(expectedArgs);
    expect(argResult.error).toBeUndefined();
  });

  it('should return an error for quizSize if given an invalid quizSize', () => {
    const quizSize = -20;
    const secondsPerQuestion = 70;

    const argResult = validateArgs([quizSize, secondsPerQuestion]);

    expect(argResult.error).toBeDefined();
  });

  it('should return an error for secondsPerQuestion if given an invalid secondsPerQuestion', () => {
    const quizSize = 20;
    const secondsPerQuestion = 1;

    const argResult = validateArgs([quizSize, secondsPerQuestion]);

    expect(argResult.error).toBeDefined();
  });
});
