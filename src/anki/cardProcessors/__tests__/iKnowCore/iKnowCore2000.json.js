export default ({
  name: 'iKnow Core 2000',
  notes: [],
  children: [
    {
      name: 'Lesson 01',
      children: [],
      notes: [
        {
          fields: [
            'id1',
            'some{{::CLOZE::.L.≠(X,Y)?}}text',
            '',
            'english',
            'alt answer',
            '',
            '<img src="test.jpg" />',
          ],
        },
      ],
    },
    {
      name: 'Lesson 02',
      children: [],
      notes: [
        {
          fields: [
            'id2',
            'another{{::C::.}}expression',
            '',
            'english',
            '',
            '',
            '',
          ],
        },
      ],
    },
  ],
});
