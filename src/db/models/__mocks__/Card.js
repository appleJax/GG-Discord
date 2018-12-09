const Card = {
  docs: [],

  find(target) {
    let filteredDocs = this.docs;
    // for (const prop of Object.getOwnPropertyNames(target)) {
    for (const prop of Object.getOwnPropertyNames({})) {
      filteredDocs = filteredDocs.filter(
        doc => doc[prop] === target[prop],
      );
    }

    return Promise.resolve(filteredDocs);
  },

  async findOne(target) {
    const filteredDocs = await this.find(target);
    return filteredDocs[0];
  },

  remove() {
    this.docs = [];
  },

  insertMany(newDocs) {
    this.docs = this.docs.concat(newDocs);
  },
};

export { Card };
