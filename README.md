# Knockout Tournament

The goal of this task is to simulate a single-elimination knockout tournament in the browser, determining the winner as quickly as possible.

We expect this task will take 2-3 hours.

The simulation must implement the following flow:

1. The user clicks the start button.
1. The first round's match-ups are fetched from the server.
1. The winner of a match moves on to the next round and matches up against the adjacent winner(s).
1. Matches are simulated until the winning team is determined.
1. The winning team's name is shown in the UI.

Teams have ratings and matches have target ratings that are constant for the duration of the tournament. To simulate a match:

1. The match's target rating is fetched from the server.
1. The team whose rating is closest to the target rating wins.
1. In the event of a tie, the team with the lowest ID wins.

### UI Requirements
Please implement the simple UI wireframes outlined below. Minimal styling is acceptable.

Display a square for each match in the entire tournament as soon as possible:
```
□ □ □ □ □ □ □
```

Completed matches should be filled with a solid colour:
```
■ ■ ■ □ □ □ □
```

When the winner is determined, display it above the squares:

```
Killara Quokkas is the winner.

■ ■ ■ ■ ■ ■ ■
```

## Constraints

You may:

- Develop only for Chrome
- Use any feature available in the latest stable release of Chrome

You must not:

- Use any frameworks or libraries (Angular, jQuery, React, etc.)
- Edit any other file than `client.js`

## Marking Criteria

Your code should be clear and easy to understand:

- Avoids unnecessary complexity / over-engineering
- Brief comments are added where appropriate
- Follows a module pattern

Your code should be performant:

- Intelligently coordinates dependent asynchronous tasks
- Parallelise asynchronous tasks where possible
- Gives feedback to the user as soon as possible (perceived performance)

Your code should be testable (but writing tests isn't necessary):

- Class-based architecture (ES6 classes preferred)
- Dependency injection (the design pattern, not a framework or library)
- No singletons or static mutable state 

## Server
### Server Test Endpoints
We have added several test endpoints so you can validate your submission.

```
POST localhost:8765/tournament/test/small
POST localhost:8765/tournament/test/small/tie
POST localhost:8765/tournament/test/large
POST localhost:8765/tournament/test/large/tie
```

The expected winning team for all of these endpoints is `SUCCESS!`

If your implementation is broken, the winning team name name will be `FAIL!`

### Server API

#### `POST localhost:8765/tournament`
#### `POST localhost:8765/tournament/test/{small,small/tie,large,large/tie}`

Creates a tournament and gets the first round's matches.

```
$ curl -X POST localhost:8765/tournament
{
  tournamentId: 0,
  matchUps: [{
    match: 0,
    teams: [{
      teamId: 12,
      name: "Camden Wombats",
      rating: 8
    }, {
      teamId: 34,
      name: "Sydney Dropbears",
      rating: 34
    }]
  }, {
    match: 1,
    teams: [{
      teamId: 56,
      name: "Yarrawarrah Eucalypts",
      rating: 8
    }, {
      teamId: 78,
      name: "Greendale Boomerangs",
      rating: 34
    }]
  }]
}
```

#### `GET /match`

Gets match data.

##### Query Parameters
| Name           | Type     | Description                         |
|:---------------|:---------|:------------------------------------|
| `tournamentId` | `number` | Tournament ID                       |
| `round`        | `number` | Round of the tournament (0-indexed) |
| `match`        | `number` | Match of the round (0-indexed)      |


```
$ curl localhost:8765/match?tournamentId=0&round=0&match=0
{
  targetRating: 21
}
```