import { Card } from 'Models/Card'

beforeEach(() => {
  Card.insertMany([
    { cardId: '1', otherProp: 'prop' },
    { cardId: '2', otherProp: 'prop' },
    { cardId: '3' },
    { cardId: '4' },
  ])
});

afterEach(() => {
  Card.remove();
});


test('should mock', async () => {
  console.log('CARD:', Card)
  const doc = { otherProp: 'prop' };

  const document = await Card.find(doc)

  expect(document).toEqual({ cardId: '1', otherProp: 'prop' });
});