import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
// import { isCorrect, tryCatch } from 'Utils';

passport.use(
  new LocalStrategy(
    async (username, password, done) => {
      // if (isCorrect(password)) {
      //   const user = await getUser({ handle: username })
      //   if (user && user.permissions.includes('admin')) {
      //     return done(null, user)
      //   }
      // }
      done(null, false, { message: 'Not Authorized' });
    },
  ),
);

passport.serializeUser(
  (user, done) => done(null, user.userId),
);

passport.deserializeUser(
  async (userId, done) => {
    // const user = await tryCatch(
    //   getUser({ userId })
    // )
    // done(null, user);
    done(null);
  },
);

export default passport;
