import Mongoose from 'mongoose';
import { t } from 'DB/utils';

const { Schema } = Mongoose;

const schema = new Schema({
  roomId: String,
  currentQuestion: { type: Schema.Types.ObjectId, ref: 'Card' },
  questions: [{ type: Schema.Types.ObjectId, ref: 'Card' }],
  secondsPerQuestion: t(Number, 60),
  questionPosition: t([Number], []),
  points: t(
    [{
      userId: Number,
      correctAnswers: t(Number, 0),
    }], [],
  ),
});

const Quiz = Mongoose.model('Quiz', schema);

export { Quiz };
