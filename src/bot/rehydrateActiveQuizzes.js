import { tryCatch } from 'Utils';
import { Quiz } from 'Models';
import handleQuestionTimeout from 'Bot/handleQuestionTimeout';
import { askNextQuestion, endQuiz } from 'Bot/utils';

export default async function rehydrateActiveQuizzes(client) {
  const activeQuizzes = await tryCatch(
    Quiz
      .find()
      .populate('currentQuestion')
      .populate('onDeckQuestion')
      .populate('questions')
      .lean()
      .exec(),
  );

  activeQuizzes.forEach((activeQuiz) => {
    const { roomId, timer } = activeQuiz;
    const channel = client.channels.get(roomId);
    const timeLeft = Math.max(0, timer.time - Date.now());

    switch ((timer || {}).name) {
      case 'endQuiz':
        setEndQuizTimeout(timeLeft, channel, activeQuiz);
        break;
      case 'questionTimeout':
        activeQuiz.questionTimeout = setQuestionTimeout(timeLeft, channel);
        break;
      case 'askNextQuestion':
        activeQuiz.nextQuestion = setAskNextQuestionTimeout(timeLeft, channel);
        break;
      default:
        break;
    }

    client.quizzes.set(roomId, activeQuiz);
  });
}

// private

function setEndQuizTimeout(timeLeft, channel, activeQuiz) {
  return setTimeout(
    () => endQuiz(channel, activeQuiz),
    timeLeft,
  );
}

function setQuestionTimeout(timeLeft, channel) {
  return setTimeout(
    () => handleQuestionTimeout(channel),
    timeLeft,
  );
}

function setAskNextQuestionTimeout(timeLeft, channel) {
  return setTimeout(
    () => askNextQuestion(channel),
    timeLeft,
  );
}
