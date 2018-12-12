import Mongoose from 'mongoose';
import { t } from 'DB/utils';

const { Schema } = Mongoose;

const schema = new Schema({
  userId: String,
  username: String,
  tag: String,
  correctAnswers: t(Number, 0),
  nextPercentMilestone: t(Number, 0.25),
  subScores: t([String], []), // roomIds
});

const User = Mongoose.model('User', schema);

export { User };
