module.exports = {
  "extends": "airbnb-base",
  "plugins": ["jest"],
  "env": {
    "jest/globals": true
  },
  "rules": {
    'import/no-unresolved': 0,
    "import/prefer-default-export": 0,
    "no-param-reassign": 0,
    "no-plusplus": 0,
    "no-use-before-define": 0,
  }
};
