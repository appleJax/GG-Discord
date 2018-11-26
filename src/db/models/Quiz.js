import Mongoose from 'mongoose';
import { t } from 'DB/utils';

const { Schema } = Mongoose;

const schema = new Schema({
  roomId: String,
  currentQuestion: { type: Schema.Types.ObjectId, ref: 'Card' },
  onDeckQuestion: { type: Schema.Types.ObjectId, ref: 'Card' },
  questions: [{ type: Schema.Types.ObjectId, ref: 'Card' }],
  questionPosition: t([Schema.Types.Mixed], []),
  rebukes: t([String], []),
  secondsPerQuestion: t(Number, 60),
  survivalRecord: t(Number, 0),
  survivalMode: t(Boolean, false),
  points: t(
    [{
      _id: false,
      userId: Number,
      correctAnswers: t(Number, 0),
    }], [],
  ),
  timer: {
    name: String,
    time: Number,
  },
  solo: {
    id: String,
    username: String,
  },
});

const Quiz = Mongoose.model('Quiz', schema);

export { Quiz };
