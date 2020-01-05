import Mongoose from 'mongoose';

const { MONGODB_URI } = process.env;

Mongoose.pluralize(null);

export default function connectDB() {
  return new Promise((resolve) => {
    Mongoose.connect(MONGODB_URI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
    });
    const db = Mongoose.connection;

    db.on('error', console.error);
    db.on('disconnect', connectDB);
    db.once('open', resolve);
  });
}
