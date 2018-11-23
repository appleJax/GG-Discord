/* eslint-disable */
let DECKS = {
  '504554082984525854': 'Gamegogakuen JP',
  '505262797572276254': 'DBJG',
  '448017333907095562': 'DIJG',
  '507815046886457344': 'iKnow Core 2000',
  '': 'iKnow Core 6000',
};

if (process.env.NODE_ENV !== 'production') {
  DECKS = {
    '512832378427932692': 'Gamegogakuen JP',
    '512832466575294484': 'DBJG',
    '512832494173945857': 'DIJG',
    '512832558300397589': 'iKnow Core 2000',
    '514602093391380480': 'iKnow Core 6000',
    // solo survival
    '515423394926428160': 'Gamegogakuen JP',
    '515423356720250881': 'DBJG',
    '515423426962522152': 'DIJG',
    '515423477281325067': 'iKnow Core 2000',
    '515423516217311234': 'iKnow Core 6000',
    soloSurvival: [
      '515423394926428160',
      '515423356720250881',
      '515423426962522152',
      '515423477281325067',
      '515423516217311234',
    ],
  };
}

export default DECKS;
