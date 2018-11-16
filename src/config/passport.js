import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { isCorrect } from 'Utils';

passport.use(
  new LocalStrategy(
    (username, password, done) => {
      if (isCorrect(username, password)) {
        return done(null, { permissions: ['admin'] });
      }
      return done(null, false, { message: 'Not Authorized' });
    },
  ),
);

passport.serializeUser(
  (user, done) => done(null, user),
);

passport.deserializeUser(
  (userId, done) => done(null, { permissions: ['admin'] }),
);

export default passport;
