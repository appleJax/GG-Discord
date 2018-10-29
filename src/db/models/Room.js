import Mongoose from 'mongoose';
import { t } from 'DB/utils';

const { Schema } = Mongoose;

const schema = new Schema({
  roomId: String,
  deck: String,
  highScore: t(Number, 0),
});

export default Mongoose.model('Room', schema);
