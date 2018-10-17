import Mongoose from 'mongoose'
import { t } from 'DB/utils'

const Schema = Mongoose.Schema

const schema = new Schema({
  cardId: String,
  deck: String,
  question: String,
  answer: t( [String], [] )
})

export default Mongoose.model('Card', schema)
