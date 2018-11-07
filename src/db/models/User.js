import Mongoose from 'mongoose';
import { t } from 'DB/utils';

const { Schema } = Mongoose;

const schema = new Schema({
  userId: String,
  score: {
    _id: false,
    total: t(Number, 0),
    correctAnswers: t(Number, 0),
    survivalRecord: t(Number, 0),
    avgAnswerTime: t(Number, 0),
    subScores: t([String], []), // roomIds
  },
});

export default Mongoose.model('User', schema);
