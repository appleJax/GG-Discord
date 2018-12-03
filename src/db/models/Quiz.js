import Mongoose from 'mongoose';
import { t } from 'DB/utils';
import { END_DELAY, PACE_DELAY } from 'Bot/utils';

const { Schema } = Mongoose;

const schema = new Schema({
  roomId: String,
  currentQuestion: { type: Schema.Types.ObjectId, ref: 'Card' },
  onDeckQuestion: { type: Schema.Types.ObjectId, ref: 'Card' },
  endDelay: t(Number, END_DELAY),
  paceDelay: t(Number, PACE_DELAY),
  questions: [{ type: Schema.Types.ObjectId, ref: 'Card' }],
  questionPosition: t([Schema.Types.Mixed], []),
  rebukes: t([String], []),
  secondsPerQuestion: t(Number, 60),
  survivalRecord: t(Number, 0),
  survivalMode: t(Boolean, false),
  points: t(
    [{
      _id: false,
      userId: String,
      username: String,
      correctAnswers: t(Number, 0),
    }], [],
  ),
  solo: {
    id: String,
    username: String,
  },
  timer: {
    name: String,
    time: Number,
  },
});

const Quiz = Mongoose.model('Quiz', schema);

export { Quiz };
