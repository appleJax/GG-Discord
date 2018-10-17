import passport from 'Config/passport';
import authorization from 'express-authorization';
import multer from 'multer';
// import DB from 'DB/ops';
import { tryCatch } from 'Utils';

const upload = multer({ dest: 'uploads/' });


export default (app) => {

  // Admin Panel

  app.get('/',
    redirectAdmin,
    (req, res) => res.render('index')
  );

  app.get('/login',
    redirectAdmin,
    (req, res) => res.render('login')
  );

  app.post('/login',
    passport.authenticate('local', {
      failureRedirect: '/',
      successRedirect: '/admin'
    })
  );

  app.post('/logout', (req, res) => {
    req.session.destroy(console.error);
    res.redirect('/login');
  });

  app.get('/admin',
    authorization.ensureRequest.isPermitted('admin'),
    (req, res) => res.render('admin', { adminUser: true })
  );

  // app.post('/deck/new',
  //   authorization.ensureRequest.isPermitted('admin'),
  //   upload.single('zipfile'), (req, res) =>
  //     DB.addDeck(req).then(_ => res.redirect('/admin'))
  // );

  // app.post('/scores/edit',
  //   authorization.ensureRequest.isPermitted('admin'),
  //   DB.adjustScore
  // );

}

function redirectAdmin(req, res, next) {
  if (authorization.considerSubject(req.user).isPermitted('admin'))
    res.redirect('/admin');
  else next();
}