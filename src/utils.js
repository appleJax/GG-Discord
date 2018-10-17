import crypto from 'crypto';

const { ADMIN_PW } = process.env;

export function isCorrect(password) {
  const pw = Buffer.alloc(256);
  pw.write(password);

  const adminPw = Buffer.alloc(256);
  adminPw.write(ADMIN_PW);

  return crypto.timingSafeEqual(pw, adminPw);
}

export function tryCatch(promise) {
  return promise
    .then(data => data)
    .catch((err) => {
      console.error('Error:', err);
      return {};
    });
}
