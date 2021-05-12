const {TournamentController, TournamentApp} = require('./tournament_server');
const path = require('path');
const {TournamentManager} = require('./tournament');

const staticPath = path.dirname(__dirname);
const getDelay = () => Math.random() * 1000;
const tournamentManager = new TournamentManager();
const tournamentController = new TournamentController(tournamentManager);
const server = new TournamentApp(staticPath, getDelay, tournamentController);
server.init(8765);
