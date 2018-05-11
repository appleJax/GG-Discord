import Mongoose from 'mongoose';
import { t } from './utils';

const Schema = Mongoose.Schema;

const schema = new Schema({
  roomId: String,
  decks: t( [ String ], [] ),
  session: {
    deck: String,
    availableCardIds: t( [ String ], [] ),
    scoreLimit: t( Number, 15 ),
    unansweredStreak: t( Number, 0 ),
    questionTimeout: t( Number, 10 ),
    userPoints: [
      {
        userId: String,
        points: t( Number, 0 )
      }
    ]
  }
});

export default Mongoose.model('Room', schema);