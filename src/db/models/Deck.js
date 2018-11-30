import Mongoose from 'mongoose';
import { t } from 'DB/utils';

const { Schema } = Mongoose;

const schema = new Schema({
  name: String,
  survivalRecord: t(Number, 0),
  users: t(
    [{
      _id: false,
      userId: String,
      username: String,
      correctAnswers: t(Number, 0),
      uniqueCardsCorrect: t([String], []),
      survivalRecord: t(Number, 0),
    }], [],
  ),
});

const Deck = Mongoose.model('Deck', schema);

export { Deck };
