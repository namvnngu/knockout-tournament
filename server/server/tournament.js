const TeamIdGenerator = require('./teamIdGenerator');
const TeamNameGenerator = require('./teamNameGenerator');

const TOURNAMENT_ERROR_TYPE = {
  INVALID: 'INVALID',
  NOT_FOUND: 'NOT_FOUND'
};

class TournamentManager {
  constructor() {
    this.tournaments = [];
  }

  createTournament(teamsPerMatch, numberOfTeams, options = {}) {
    const teamNameGenerator = TeamNameGenerator.create();
    const teamIdGenerator = TeamIdGenerator.create(numberOfTeams);

    const defaultOptions = {
      getTeamName: () => teamNameGenerator.next(),
      getTeamId: index => teamIdGenerator.next(),
      getTeamRating: () => Math.round(Math.random() * 100),
      getMatchTargetRating: () => Math.round(Math.random() * 100)
    };

    const tournamentOptions = { ...defaultOptions, ...options };

    return Tournament.create(numberOfTeams, teamsPerMatch, tournamentOptions);
  }

  addTournament(tournament) {
    const tournamentId = this.tournaments.length;
    this.tournaments.push(tournament);
    return tournamentId;
  }

  getTournament(tournamentId) {
    tournamentId = Math.floor(tournamentId || undefined);

    if (isNaN(tournamentId)) {
      throw new TournamentError(TOURNAMENT_ERROR_TYPE.INVALID, 'Looks like you\'re missing a tournament ID');
    }
    const tournament = this.tournaments[tournamentId];
    if (tournament == null) {
      throw new TournamentError(TOURNAMENT_ERROR_TYPE.NOT_FOUND, 'Are you sure that\'s the right tournament ID?');
    }
    return tournament;
  }
}

class Tournament {
  constructor(teams, matches, firstRoundMatchUps, getWinningRating, teamsPerMatch) {
    this.teams = teams;
    this.matches = matches;
    this.firstRoundMatchUps = firstRoundMatchUps;
    this.getWinningRating = getWinningRating;
    this.teamsPerMatch = teamsPerMatch;
  }

  static create(numberOfTeams, teamsPerMatch, options) {
    const {getTeamName, getTeamId, getTeamRating, getMatchTargetRating, getWinningRating} = options;
    teamsPerMatch = Math.floor(teamsPerMatch || undefined);
    numberOfTeams = Math.floor(numberOfTeams || undefined);

    if (isNaN(teamsPerMatch)) {
      throw new TournamentError(TOURNAMENT_ERROR_TYPE.INVALID, 'Oops, you forgot to give me the teams per match');
    }

    if (teamsPerMatch <= 1) {
      throw new TournamentError(TOURNAMENT_ERROR_TYPE.INVALID, `Can\'t run a tournament with 1 or fewer teams per match, and you tried with ${teamsPerMatch}`);
    }

    if (isNaN(numberOfTeams)) {
      throw new TournamentError(TOURNAMENT_ERROR_TYPE.INVALID, 'Oops, you forgot to give me the number of teams in the tournament');
    }

    const numberOfRounds = Tournament.getNumberOfRounds(teamsPerMatch, numberOfTeams);

    if (numberOfRounds == null || numberOfRounds <= 0) {
      throw new TournamentError(TOURNAMENT_ERROR_TYPE.INVALID, 'Wait... you can\'t make a knockout tournament with that number of teams');
    }

    const teams = [];
    for (let i = 0; i < numberOfTeams; i++) {
      const teamId = getTeamId(i);
      teams.push(new Team(teamId, getTeamName(i, teamId), getTeamRating(i, teamId)));
    }

    const matches = [];
    let numberOfMatchesThisRound = numberOfTeams;
    for (let round = 0; round < numberOfRounds; round++) {
      matches[round] = [];
      numberOfMatchesThisRound /= teamsPerMatch;
      for (let match = 0; match < numberOfMatchesThisRound; match++) {
        matches[round].push(new Match(getMatchTargetRating(round, match)));
      }
    }

    const teamsInMatchUp = [];
    const firstRoundMatchUps = [];

    for (let j = 0; j < teams.length; j++) {
      teamsInMatchUp.push(teams[j]);
      if (teamsInMatchUp.length === teamsPerMatch) {
        firstRoundMatchUps.push({
          match: firstRoundMatchUps.length,
          teams: teamsInMatchUp.splice(0)
        });
      }
    }

    return new Tournament(teams, matches, firstRoundMatchUps, getWinningRating, teamsPerMatch);
  }

  // This is a long way of doing Math.log(numberOfTeams) / Math.log(teamsPerMatch).
  // Because floating point in JS, Math.log(9) / Math.log(3) => 2.0000000000000004
  // We need to be guaranteed an integer to know if the server should error.
  static getNumberOfRounds(teamsPerMatch, numberOfTeams) {
    let rounds = 1;
    let teamCount;

    for(teamCount = teamsPerMatch; teamCount < numberOfTeams; teamCount *= teamsPerMatch) {
      rounds++;
    }

    return teamCount === numberOfTeams
        ? rounds
        : null;
  }

  getMatchUps() {
    return this.firstRoundMatchUps;
  };

  getMatch(round, match) {
    round = Math.floor(round || undefined);
    match = Math.floor(match || undefined);

    if (isNaN(round) || isNaN(match)) {
      throw new TournamentError(TOURNAMENT_ERROR_TYPE.INVALID, 'For me to give up the match data, you need to tell me the round and match numbers');
    }

    if (!this.matches[round]) {
      throw new TournamentError(TOURNAMENT_ERROR_TYPE.NOT_FOUND, 'That round does not exist in this tournament');
    }

    if (!this.matches[round][match]) {
      throw new TournamentError(TOURNAMENT_ERROR_TYPE.NOT_FOUND, 'That match does not exist in this round');
    }

    return this.matches[round][match];
  }
}

class Team {
  constructor(teamId, name, rating) {
    this.teamId = teamId;
    this.name = name;
    this.rating = rating;
  }
}

class Match {
  constructor(targetRating) {
    this.targetRating = targetRating;
  }
}

class TournamentError {
  constructor(type, message) {
    this.type = type;
    this.message = message;
  }
}

module.exports = {TournamentManager, TournamentError, TOURNAMENT_ERROR_TYPE};
