// Edit me.
// const SERVER_URL = "http://localhost:8765";
const SERVER_URL = "https://knockout-tournament.herokuapp.com";

class Team {
  constructor(teamId, name, rating) {
    this.teamId = teamId;
    this.name = name;
    this.rating = rating;
  }
}

class Match {
  constructor(id, teams) {
    this.id = id;
    this.targetRating = 0;
    this.teams = teams;
  }

  retrieveTargetRating(tournamentId, roundId, matchId) {
    const URL = `${SERVER_URL}/match?tournamentId=${tournamentId}&round=${roundId}&match=${matchId}`;

    return Utils.fetchWithGetRequest(URL).then(
      ({ targetRating }) => (this.targetRating = targetRating)
    );
  }

  getWinner() {
    let winner;
    let minDifference = Number.MAX_VALUE;
    for (let team of this.teams) {
      let currentDifference = Math.abs(team.rating - this.targetRating);
      if (currentDifference < minDifference) {
        winner = team;
        minDifference = currentDifference;
      }

      if (currentDifference === minDifference) {
        winner = winner.teamId <= team.teamId ? winner : team;
      }
    }

    return winner;
  }
}

class Round {
  constructor(id, matches, viewEngine) {
    this.id = id;
    this.matches = matches;
    this.winners = [];
    this.viewEngine = viewEngine;
  }

  async findWinners(tournamentId) {
    let winners = await Promise.all(
      this.matches.map(async (match) => {
        await match.retrieveTargetRating(tournamentId, this.id, match.id);
        let winner = match.getWinner();

        // Update view
        if (this.viewEngine) {
          viewEngine.update(this.id, match.id);
        }

        return winner;
      })
    );

    this.winners = winners;
    return this.winners;
  }
}

class Tournament {
  constructor(id, teams, matches, teamsPerMatch, numberOfRound) {
    this.id = id;
    this.teams = teams;
    this.matches = matches;
    this.teamsPerMatch = teamsPerMatch;
    this.numberOfRound = numberOfRound;
    this.winner = null;
  }

  static init(tournamentId, matchUps) {
    let tournamentTeams = [];
    let tournamentMatches = [];
    const tournamentTeamsPerMatch =
      matchUps.length > 0 ? matchUps[0].teams.length : 0;
    const numberOfTeams = matchUps.length * tournamentTeamsPerMatch;
    const numberOfRounds = Tournament.getNumberOfRounds(
      tournamentTeamsPerMatch,
      numberOfTeams
    );

    for (let matchUp of matchUps) {
      const { match: matchId, teams } = matchUp;
      let currentTemporaryTeams = [];

      // Team
      for (let team of teams) {
        const { teamId, name, rating } = team;

        currentTemporaryTeams.push(new Team(teamId, name, rating));
      }

      tournamentTeams = [...tournamentTeams, ...currentTemporaryTeams];

      // Match
      tournamentMatches.push(new Match(matchId, currentTemporaryTeams));
    }

    return new Tournament(
      tournamentId,
      tournamentTeams,
      tournamentMatches,
      tournamentTeamsPerMatch,
      numberOfRounds
    );
  }

  static getNumberOfRounds(teamsPerMatch, numberOfTeams) {
    let rounds = 1;
    let teamCount;

    for (
      teamCount = teamsPerMatch;
      teamCount < numberOfTeams;
      teamCount *= teamsPerMatch
    ) {
      rounds++;
    }

    return teamCount === numberOfTeams ? rounds : null;
  }
}

class TournamentManager {
  constructor(viewEngine) {
    this.tournament = null;
    this.viewEngine = viewEngine;
  }

  async startTournament(url) {
    const { tournamentId, matchUps } = await Utils.fetchWithPostRequest(url);

    this.tournament = Tournament.init(tournamentId, matchUps);

    if (this.viewEngine) {
      this.viewEngine.tournament = this.tournament;
      this.viewEngine.init();
    }

    return this.tournament;
  }

  async runTournament() {
    if (this.tournament === null) return;

    const numberOfRound = this.tournament.numberOfRound
      ? this.tournament.numberOfRound
      : 0;
    const tournamentId = this.tournament.id;

    for (let roundId = 0; roundId < numberOfRound; roundId++) {
      const matches = this.tournament.matches ? this.tournament.matches : null;
      let round = new Round(roundId, matches, this.viewEngine);
      let winners = await round.findWinners(tournamentId, this.viewEngine);

      // Next Round
      if (roundId != numberOfRound - 1) {
        this.tournament.teams = winners.slice();
        this.tournament.matches = [];

        for (
          let index = 0;
          index < this.tournament.teams.length / this.tournament.teamsPerMatch;
          index++
        ) {
          let matchId = index;
          let matchTeams = winners.splice(0, this.tournament.teamsPerMatch);

          this.tournament.matches.push(new Match(matchId, matchTeams));
        }
      } else {
        this.tournament.winner = winners[0];
      }
    }

    return this.tournament;
  }
}

class Utils {
  static fetchWithPostRequest(url) {
    return fetch(url, { method: "POST" })
      .then((response) => response.json())
      .catch((error) => console.log(error));
  }

  static fetchWithGetRequest(url) {
    return fetch(url)
      .then((response) => response.json())
      .catch((error) => console.log(error));
  }
}

class ViewEngine {
  COMPLETED_MATCH = "■";
  INCOMPLETED_MATCH = "□";

  constructor() {
    this.tournament = null;
    this.body = document.body;
    this.winnerSpan = document.getElementById("winner");
    this.processingElement = document.createElement("p");
    this.matchesView = document.createElement("p");
    this.rounds = [];

    // Center all items
    this.body.style.textAlign = "center";
  }

  init() {
    const numberOfRound = this.tournament.numberOfRound;
    const numberOfTeams = this.tournament.teams.length;
    const teamsPerMatch = this.tournament.teamsPerMatch;
    let numberOfMatch = numberOfTeams / teamsPerMatch;

    this.body.appendChild(this.processingElement);
    this.body.appendChild(this.matchesView);

    // Formulate incompleted matches
    for (let round = 0; round < numberOfRound; round++) {
      let round = new Array(numberOfMatch).fill(this.INCOMPLETED_MATCH);

      this.rounds.push(round);
      numberOfMatch /= teamsPerMatch;
    }

    // Render incompleted matches
    this.displayRounds();
  }

  displayWinner(name) {
    const output = `<p>${name} is the winner</p>`;

    this.winnerSpan.innerHTML = output;
  }

  displayProcessing(inProcess) {
    const text = inProcess ? "Finding a winner is in process..." : "";
    this.processingElement.innerText = text;
  }

  displayRounds() {
    this.matchesView.innerHTML = "";

    for (let round of this.rounds) {
      let roundText = round.join(" ");
      let divElement = document.createElement("div");

      divElement.innerHTML = roundText;
      divElement.style.textAlign = "center";
      this.matchesView.appendChild(divElement);
    }
  }

  update(roundId, matchId) {
    this.rounds[roundId][matchId] = this.COMPLETED_MATCH;

    this.displayRounds();
  }

  clearView() {
    this.winnerSpan.innerHTML = "";
    this.processingElement.innerHTML = "";
    this.matchesView.innerHTML = "";
    this.rounds = [];
  }
}

// Main
const viewEngine = new ViewEngine();
const tournamentManager = new TournamentManager(viewEngine);
const TOURNAMENT_URL = `${SERVER_URL}/tournament`;
const startButton = document.getElementById("start");
let inProcess = false;

startButton.addEventListener("click", async () => {
  viewEngine.clearView();

  if (!inProcess) {
    inProcess = true;
    viewEngine.displayProcessing(inProcess);
    startButton.disabled = inProcess;

    let tournament = await tournamentManager.startTournament(TOURNAMENT_URL);
    tournament = await tournamentManager.runTournament();
    let winner = tournament.winner;
    viewEngine.displayWinner(winner.name);

    inProcess = false;
    viewEngine.displayProcessing(inProcess);
    startButton.disabled = inProcess;
  }
});

// Testing
class Tester {
  constructor() {}

  async runAllTest() {
    const testEndpoints = [
      "tournament/test/small",
      "tournament/test/small/tie",
      "tournament/test/large",
      "tournament/test/large/tie",
    ];
    const testURLs = testEndpoints.map(
      (testEndpoint) => `${SERVER_URL}/${testEndpoint}`
    );

    await Promise.all(testURLs.map(this.runTest));
  }

  async runTest(url) {
    const testingTournamentManager = new TournamentManager(null);
    await testingTournamentManager.startTournament(url);
    const tournament = await testingTournamentManager.runTournament();
    const winner = tournament.winner;

    if (winner.name === "SUCCESS!") {
      console.log(`${url}: PASSED`);
    } else {
      console.log(`${url}: FAILED`);
    }
  }
}

const tester = new Tester();
tester.runAllTest();
