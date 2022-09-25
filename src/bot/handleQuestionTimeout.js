import { EmbedBuilder } from "discord.js";
import { tryCatch } from "Utils";
import { Quiz } from "Models";
import {
  Colors,
  askNextQuestion,
  endQuiz,
  notifyMilestones,
  prepareNextQuestion,
  sendImage,
  sendWithRetry,
} from "Bot/utils";

export default async function handleQuestionTimeout(channel) {
  const roomId = channel.id;
  const activeQuiz = channel.client.quizzes.get(roomId);

  if (activeQuiz == null) {
    return;
  }

  const { currentQuestion } = activeQuiz;

  clearTimeout(activeQuiz.questionTimeout);
  prepareNextQuestion(activeQuiz);

  const revealAnswer = new EmbedBuilder()
    .setColor(Colors.GOLD)
    .addFields([{ name: "Time's up!", value: currentQuestion.answerText }]);

  sendWithRetry(channel, revealAnswer);

  if (currentQuestion.mediaUrls) {
    const answerImages = currentQuestion.mediaUrls.slice(
      currentQuestion.mainImageSlice[1]
    );

    answerImages.forEach((image) => {
      sendImage(channel, image);
    });
  }

  if (activeQuiz.survivalMode || activeQuiz.isFinished) {
    setTimeout(() => endQuiz(channel, activeQuiz), activeQuiz.endDelay);

    const endQuizTime = Date.now() + activeQuiz.endDelay;
    Quiz.updateOne(
      { roomId },
      {
        $set: {
          "timer.name": "endQuiz",
          "timer.time": endQuizTime,
        },
      }
    )
      .exec()
      .catch(console.error);

    return;
  }

  await tryCatch(notifyMilestones(channel, activeQuiz));

  activeQuiz.nextQuestion = setTimeout(
    () => askNextQuestion(channel),
    activeQuiz.paceDelay
  );

  const askNextQuestionTime = Date.now() + activeQuiz.paceDelay;
  const updatedQuiz = {
    ...activeQuiz,
    roomId,
    currentQuestion: activeQuiz.currentQuestion._id,
    onDeckQuestion: activeQuiz.onDeckQuestion._id,
    questions: activeQuiz.questions.map((obj) => obj._id),
    questionTimeout: null,
    nextQuestion: null,
    timer: {
      name: "askNextQuestion",
      time: askNextQuestionTime,
    },
  };

  Quiz.replaceOne({ roomId }, updatedQuiz).exec().catch(console.error);
}
