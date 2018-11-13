import Mongoose from 'mongoose';
import { t } from 'DB/utils';

const { Schema } = Mongoose;

const schema = new Schema({
  roomId: String,
  deck: String,
  highScore: t(Number, 0),
  users: t(
    [{
      _id: false,
      userId: String,
      totalScore: t(Number, 0),
      correctAnswers: t(Number, 0),
      survivalRecord: t(Number, 0),
      avgAnswerTime: t(Number, 0),
    }], []
  )
});

const Room = Mongoose.model('Room', schema);

export { Room };
