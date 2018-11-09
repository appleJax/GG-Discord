import passport from 'Config/passport';
import authorization from 'express-authorization';
import multer from 'multer';
import DB from 'DB/ops';

const upload = multer({ dest: 'uploads/' });

let ensureAdmin = authorization
  .ensureRequest
  .redirectTo('/login')
  .isPermitted('admin');

// bypass login
if (process.env.NODE_ENV === 'development') {
  ensureAdmin = (req, res, next) => next();
}

export default (app) => {
  app.use(passport.initialize());
  app.use(passport.session());

  // if there's a flash message in the session request,
  // make it available in the response, then delete it
  app.use((req, res, next) => {
    if (req.session) {
      res.locals.flash = req.session.flash;
      delete req.session.flash;
      next();
    } else next();
  });

  // Admin Panel

  app.get('/',
    redirectAdmin,
    (req, res) => res.render('index'));

  app.get('/login',
    redirectAdmin,
    (req, res) => res.render('login'));

  app.post('/login',
    passport.authenticate('local', {
      failureRedirect: '/',
      successRedirect: '/admin',
    }));

  app.post('/logout', (req, res) => {
    req.session.destroy(console.error);
    res.redirect('/login');
  });

  app.get('/admin',
    ensureAdmin,
    serveAdminPage);

  app.get('/queue/:taskId', DB.queueStatus);

  app.post('/deck/new',
    ensureAdmin,
    upload.single('zipfile'),
    DB.addDeck
  );
};

function redirectAdmin(req, res, next) {
  if (authorization.considerSubject(req.user).isPermitted('admin')) {
    res.redirect('/admin');
  } else next();
}

function serveAdminPage(req, res) {
  res.render('admin', {
    adminUser: true,
    flash: res.locals.flash,
  });
}
