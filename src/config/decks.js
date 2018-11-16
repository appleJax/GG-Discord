/* eslint-disable */
let DECKS = {
  '504554082984525854': 'Gamegogakuen JP',
  '505262797572276254': 'DBJG',
  '448017333907095562': 'DIJG',
  '507815046886457344': 'iKnow Core 2000',
};

if (process.env.NODE_ENV !== 'production') {
  DECKS = {
    '512832378427932692': 'Gamegogakuen JP',
    '512832466575294484': 'DBJG',
    '512832494173945857': 'DIJG',
    '512832558300397589': 'iKnow Core 2000',
  };
}

export default DECKS;
