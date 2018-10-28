import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import session from 'express-session';
import connectDB from 'Config/mongo';
import bot from './bot';
import route from './routes/admin';

const { SESSION_SECRET } = process.env;

const app = express();

app.set('port', (process.env.PORT || 3030));
app.set('view engine', 'pug');
app.set('views', path.resolve('dist/views'));
app.use(express.static(path.resolve('dist/public')));
app.use(bodyParser.urlencoded({ extended: true }));

const options = {
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {},
};

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // trust first proxy
  options.cookie.secure = true; // serve secure cookies
}

app.use(session(options));

route(app);

if (process.env.NODE_ENV === 'production') {
  bot.start();
}

const PORT = app.get('port');

async function startApp() {
  await connectDB();
  app.listen(PORT, () => console.log('Listening on port', PORT));
}

startApp();

export default app;
