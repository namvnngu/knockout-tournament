const sydneySuburbs = require('./sydney_suburbs');
const australianTeamNames = require('./australian_team_names');
const RandomizedList = require('./randomizedList');

class TeamNameGenerator {
  constructor(cityList, teamNameList) {
    this.cityList = cityList;
    this.teamNameList = teamNameList;
  }

  static create() {
    const cityList = new RandomizedList(sydneySuburbs);
    const teamNameList = new RandomizedList(australianTeamNames);
    return new TeamNameGenerator(cityList, teamNameList);
  }

  next() {
    return `${this.cityList.next()} ${this.teamNameList.next()}`;
  }
}

module.exports = TeamNameGenerator;
