import Mongoose from 'mongoose';
import { t } from 'DB/utils';

const { Schema } = Mongoose;

const schema = new Schema({
  userId: String,
  username: String,
  stats: {
    _id: false,
    correctAnswers: t(Number, 0),
    avgAnswerTime: t(Number, 0),
    subScores: t([String], []), // roomIds
  },
});

const User = Mongoose.model('User', schema);

export { User };
