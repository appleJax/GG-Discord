import Mongoose from 'mongoose';
import { t } from 'DB/utils';

const { Schema } = Mongoose;

const schema = new Schema({
  roomId: String,
  deck: String,
  survivalRecord: t(Number, 0),
  users: t(
    [{
      _id: false,
      userId: String,
      correctAnswers: t(Number, 0),
      cardsAnsweredCorrectly: t([String], []),
      survivalRecord: t(Number, 0),
      avgAnswerTime: t(Number, 0),
    }], [],
  ),
});

const Room = Mongoose.model('Room', schema);

export { Room };
