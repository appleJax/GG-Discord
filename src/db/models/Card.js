import Mongoose from 'mongoose';
import { t } from 'DB/utils';

const { Schema } = Mongoose;

const schema = new Schema({
  answers: t([String], []),
  answerText: String,
  cardId: String,
  deck: String,
  game: String,
  mainImageSlice: t([Number], []),
  mediaUrls: t(
    [{
      _id: false,
      altText: String,
      image: String,
    }], [],
  ),
  questionText: String,
});

const Card = Mongoose.model('Card', schema);

export { Card };
