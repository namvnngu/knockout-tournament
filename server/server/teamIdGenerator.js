const RandomizedList = require('./randomizedList');

class TeamIdGenerator {
  constructor(idList) {
    this.idList = idList;
  }

  static create(numberOfTeams) {
      const orderedIdList = new Array(numberOfTeams).fill(null).map((_, i) => i);
      const idList = new RandomizedList(orderedIdList);
      return new TeamIdGenerator(idList);
  }

  next() {
    return this.idList.next();
  }
}

module.exports = TeamIdGenerator;
