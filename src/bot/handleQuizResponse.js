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
import saveQuizProgress from "./saveQuizProgress";

export default async function handleQuizResponse(msg) {
  if (msg.author.bot) {
    return;
  }
  const { channel } = msg;
  const { client } = channel;
  const roomId = channel.id;
  const response = msg.content.toLowerCase();
  const activeQuiz = client.quizzes.get(roomId);

  if (activeQuiz.solo && activeQuiz.solo.id !== msg.author.id) {
    if (!activeQuiz.rebukes.includes(msg.author.id)) {
      msg.reply(
        `the quiz is in Solo Mode. Only ${activeQuiz.solo.username} can answer.`
      );
      activeQuiz.rebukes.push(msg.author.id);
    }
    return;
  }

  if (
    activeQuiz.hardMode &&
    activeQuiz.incorrectAnswers.includes(msg.author.id)
  ) {
    msg.reply("in hard mode, you get only one guess per question.");
    return;
  }

  const isCorrectAnswer = activeQuiz.currentQuestion.answers.includes(response);
  if (isCorrectAnswer) {
    prepareNextQuestion(activeQuiz);
    clearTimeout(activeQuiz.questionTimeout);
  }

  const isWrongAnswer = !isCorrectAnswer;
  if (isWrongAnswer) {
    if (activeQuiz.hardMode) {
      const wrongAnswerMsg = new EmbedBuilder()
        .setColor(Colors.RED)
        .setDescription(
          `Sorry, ${response} is not correct. You get only one guess per question.`
        );

      sendWithRetry(channel, wrongAnswerMsg);

      activeQuiz.incorrectAnswers.push(msg.author.id);

      Quiz.updateOne(
        { roomId },
        {
          $set: {
            incorrectAnswers: activeQuiz.incorrectAnswers,
          },
        }
      )
        .exec()
        .catch(console.error);
    }
    return;
  }

  await tryCatch(notifyMilestones(channel, activeQuiz));

  const { currentQuestion } = activeQuiz;

  if (isCorrectAnswer) {
    const congrats = new EmbedBuilder()
      .setDescription("Correct answer acknowledgement")
      .setColor(Colors.GREEN)
      .addFields([
        {
          name: `${msg.author.username} answered correctly!`,
          value: currentQuestion.answerText,
        },
      ]);

    sendWithRetry(channel, congrats);
  }

  if (currentQuestion.mediaUrls) {
    const answerImages = currentQuestion.mediaUrls.slice(
      currentQuestion.mainImageSlice[1]
    );

    answerImages.forEach((image) => {
      sendImage(channel, image);
    });
  }

  await tryCatch(saveQuizProgress(msg, activeQuiz));

  if (activeQuiz.isFinished) {
    setTimeout(() => endQuiz(channel, activeQuiz), activeQuiz.endDelay);

    const endQuizTime = Date.now() + activeQuiz.endDelay;
    Quiz.updateOne(
      { roomId },
      {
        $set: {
          timer: {
            name: "endQuiz",
            time: endQuizTime,
          },
        },
      }
    )
      .exec()
      .catch(console.error);
    return;
  }

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
