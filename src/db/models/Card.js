import Mongoose from 'mongoose';
import { t } from 'DB/utils';

const { Schema } = Mongoose;

const schema = new Schema({
  answers: t([String], []),
  answerText: String,
  cardId: String,
  game: String,
  questionText: String,
});

export default Mongoose.model('Card', schema);
