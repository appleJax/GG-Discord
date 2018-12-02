import crypto from 'crypto';

const { ADMIN_USERNAME, ADMIN_PW } = process.env;

export function formatNumber(num) {
  const chunks = [];
  let strNum = String(num);

  while (strNum.length) {
    chunks.push(strNum.slice(-3));
    strNum = strNum.slice(0, -3);
  }

  return chunks.reverse().join(',');
}

export function isCorrect(uname, pw) {
  const username = Buffer.alloc(256);
  username.write(uname);

  const adminUsername = Buffer.alloc(256);
  adminUsername.write(ADMIN_USERNAME);

  const password = Buffer.alloc(256);
  password.write(pw);

  const adminPassword = Buffer.alloc(256);
  adminPassword.write(ADMIN_PW);

  const correctUsername = crypto.timingSafeEqual(username, adminUsername);
  const correctPassword = crypto.timingSafeEqual(password, adminPassword);

  return correctUsername && correctPassword;
}

export function tryCatch(promise) {
  return promise
    .then(data => data)
    .catch((err) => {
      console.error('Error:', err);
      return {};
    });
}
