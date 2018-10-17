import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import connectDB from 'Config/mongo';
import bot from './bot';
import route from './routes/admin';

const app = express();

app.set('port', (process.env.PORT || 3030));
app.set('view engine', 'pug');
app.set('views', path.resolve('dist/views'));
app.use(express.static(path.resolve('dist/public')));
app.use(bodyParser.urlencoded({ extended: true }));

route(app);

bot.start();

const PORT = app.get('port');

async function startApp() {
  await connectDB();
  app.listen(PORT, () => console.log('Listening on port', PORT));
}

startApp();

export default app;
