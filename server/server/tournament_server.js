const url = require('url');
const http = require('http');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const {TournamentError, TOURNAMENT_ERROR_TYPE} = require('./tournament');

class TournamentApp {
  constructor(staticPath, getDelay, tournamentController) {
    this.staticPath = staticPath;
    this.getDelay = getDelay;
    this.tournamentController = tournamentController;
    this.server = null;
  }

  init(port) {
    const app = express();

    // Tournament endpoints
    app.use(cors());
    app.use(bodyParser.urlencoded({extended: true}));

    app.post('/tournament', (req, res) => this.serve(res, this.tournamentController.createDefaultTournament(64)));
    app.post('/tournament/test/small', (req, res) => this.serve(res, this.tournamentController.createTestTournamentSmall()));
    app.post('/tournament/test/small/tie', (req, res) => this.serve(res, this.tournamentController.createTestTournamentSmallTie()));
    app.post('/tournament/test/large', (req, res) => this.serve(res, this.tournamentController.createTestTournamentLarge()));
    app.post('/tournament/test/large/tie', (req, res) => this.serve(res, this.tournamentController.createTestTournamentLargeTie()));
    // app.get('/team', (req, res) => this.serve(res, this.tournamentController.findTeam(req.query)));
    app.get('/match', (req, res) => this.serve(res, this.tournamentController.findMatch(req.query)));
    // app.get('/winner', (req, res) => this.serve(res, this.tournamentController.findWinner(req.query)));

    // Error handling
    app.use((err, req, res, next) => {
      if (err instanceof TournamentError) {
        this.serveError(res, TournamentController.handleError(err));
        return;
      }

      next(err);
    });

    this.server = app.listen(port, () => console.log(`server running on port ${port}`));
  }

  close() {
    this.server && this.server.close();
    this.server = null;
  }

  serve(res, data) {
    setTimeout(() => res.send(data), this.getDelay());
  }

  serveError(res, {status, data}) {
    res.status(status).send(data);
  }
}

class TournamentController {
  constructor(tournamentManager) {
    this.tournamentManager = tournamentManager;
  }

  _createTournament(tournament) {
    const tournamentId = this.tournamentManager.addTournament(tournament);
    const matchUps = tournament.getMatchUps();
    return {tournamentId, matchUps};
  }

  createDefaultTournament(numberOfTeams) {
    return this._createTournament(this.tournamentManager.createTournament(2, numberOfTeams));
  }

  createTestTournamentSmall() {
    const numberOfTeams = 2;
    const basicTestTournament = this.tournamentManager.createTournament(
        2,
        numberOfTeams,
        // Ensure team at index 1 is the winner.
        {
          getTeamName: index => {
            switch (index) {
              case 1:
                return 'SUCCESS!';
              default:
                return 'FAIL!';
            }
          },
          getTeamRating: index => {
            switch (index) {
              case 1:
                return 29;
              default:
                return 20;
            }
          },
          getMatchTargetRating: () => 25,
        },
    );
    return this._createTournament(basicTestTournament);
  }

  createTestTournamentSmallTie() {
    const numberOfTeams = 2;
    const basicTestTournament = this.tournamentManager.createTournament(
        2,
        numberOfTeams,
        // Ensure team at index 1 is the winner.
        {
          // This means team at index 1 has the lowest ID of 0.
          getTeamId: i => numberOfTeams - i - 1,
          getTeamName: index => {
            switch (index) {
              case 1:
                return 'SUCCESS!';
              default:
                return 'FAIL!';
            }
          },
          getTeamRating: () => 25,
          getMatchTargetRating: () => 25,
        },
    );
    return this._createTournament(basicTestTournament);
  }

  createTestTournamentLarge() {
    const numberOfTeams = 16;
    const basicTestTournament = this.tournamentManager.createTournament(
        2,
        numberOfTeams,
        // Ensure team at index 12 is the winner.
        {
          getTeamName: index => {
            switch (index) {
              case 12:
                return 'SUCCESS!';
              default:
                return 'FAIL!';
            }
          },
          getTeamRating: index => index * 10,
          getMatchTargetRating: () => 122,
        },
    );
    return this._createTournament(basicTestTournament);
  }

  createTestTournamentLargeTie() {
    const numberOfTeams = 16;
    const basicTestTournament = this.tournamentManager.createTournament(
        2,
        numberOfTeams,
        // Ensure team at index 9 is the winner.
        {
          // This means team at index 9 has a lower ID than team at index 4.
          getTeamId: i => numberOfTeams - i - 1,
          getTeamName: index => {
            switch (index) {
              case 9:
                return 'SUCCESS!';
              default:
                return 'FAIL!';
            }
          },
          getTeamRating: index => {
            switch (index) {
              case 4:
                return 29;
              case 9:
                return 31;
              default:
                return 32 + index;
            }
          },
          getMatchTargetRating: (round, match) => round * 10 + match,
        },
    );
    return this._createTournament(basicTestTournament);
  }

  findMatch({tournamentId, round, match}) {
    const tournament = this.tournamentManager.getTournament(tournamentId);
    return tournament.getMatch(round, match);
  }

  static handleError(err) {
    let status;
    switch (err.type) {
      case TOURNAMENT_ERROR_TYPE.INVALID:
        status = 400;
        break;
      case TOURNAMENT_ERROR_TYPE.NOT_FOUND:
      default:
        status = 404;
        break;
    }
    return {
      status,
      data: {
        message: err.message,
        error: true
      }
    };
  }
}

module.exports = {TournamentApp, TournamentController};
