// import { app, io, server } from "./main"
import {
  indexToPosition,
  positionToIndex,
  isLegalMove,
  tokenAt,
  makeMove,
} from "../shared/GameController.js";
import { Token, Board } from "../shared/GameModel.js";
import { joinGameCon, createGameCon, declareDrawCon, triggerTimeoutRefundCon, declareWinnerCon } from "../contract/interact.js";

function joinGame(gameCode, socket, username, games, io) {
  socket.username = username;
  console.log('Joining Game:',gameCode)

  if (!games[gameCode]) {
    console.log("Game does not exist", gameCode);
    socket.emit("gameJoinError", gameCode, "Game does not exist");
    return;
  }
  // if less than two players, join game
  if (games[gameCode].players.length < games[gameCode].maxPlayers) {
    console.log(
      "player0",
      games[gameCode].players[0],
      " joining game ",
      gameCode
    );
    if (games[gameCode].players[0] === username) {
      console.log("already in game");
      socket.emit("alreadyInGame");
      return;
    }
    games[gameCode].players.push(username);
    socket.gameCode = gameCode; // legal?

    // tell user they successfully joined
    socket.join(gameCode);
    socket.emit("gameJoined", gameCode);

    // Start the game if it is full!
    if (games[gameCode].players.length == games[gameCode].maxPlayers) {
      console.log("Starting game", gameCode);
      // Tell the other player they are red
      socket.to(gameCode).emit("gameStarted", "r");
      socket.emit("gameStarted", "b");
      // io.to(gameCode).emit("board", games[gameCode].board.boardState, games[gameCode].board.currentPlayer, games[gameCode].board.onlyMove);
    }
  } else {
    // tell user the game is full
    socket.join(gameCode);
    socket.emit("gameJoined", gameCode);
    socket.emit("gameStarted", "s");
    socket.emit(
      "board",
      games[gameCode].board.boardState,
      games[gameCode].board.currentPlayer,
      games[gameCode].board.onlyMove
    );
  }
}

export default function ioHandler(io) {
  const games = {}; // hold all our games
  io.on("connection", (socket) => {
    console.log("A user connected to the socket");

    // Game Joining
    socket.on("createGame", (username, stakeAmt) => {
      let gameCode = '#CHECKERS-' + Math.round(Math.random() * 99998 + 1).toString();
      console.log(
        "Creating game request from id",
        socket.id,
        "and game code",
        gameCode,
        " username ",
        username,
        'stakeAmt ',
        stakeAmt
      );
      socket.username = username;
      if (games[gameCode]) {
        socket.emit(
          "gameJoinError",
          gameCode,
          "You rolled the one in a million and that game already exists. Try again."
        );
        return;
      }
      
      socket.emit('sendGameData', gameCode,stakeAmt);
      // Create the game
      games[gameCode] = {
        players: [],
        playersAddr: {},
        maxPlayers: 2,
        board: new Board(),
        sockets: [],
      };
      // joinGame(gameCode, socket, username, games, io);
    });

    socket.on('verifyGameCode', (gameCode) => {
      console.log('Verifying Code:', gameCode)
      if(games[gameCode]){
        socket.emit('validGameCode', gameCode, true);
      } else {
        socket.emit('validGameCode', gameCode, false);
      }
    });

    socket.on("joinGame", (gameCode, username, stakeAmt, addr) => {
      console.log("got join game request", username, gameCode);
      if (gameCode == 69420 && !games[gameCode]) {
        games[gameCode] = {
          players: [],
          playersAddr: {},
          maxPlayers: 2,
          board: new Board(69420),
        };
        games[gameCode].playersAddr[username] = addr;
      }
      joinGame(gameCode, socket, username, games, io);
    });

    socket.on('getOpp', (gameCode, player) => {
      const players = games[gameCode].players;
      const opp = players[0];
      console.log('player:', player, 'opp:', opp);
      socket.emit('opponent', opp)
    });

    // Rebrodcast count update to relevant sockets (except the one it came from)
    socket.on("count", (gameCode, count) => {
      socket.to(gameCode).emit("count", count);
    });

    socket.on("disconnect", () => {
      let gameCode = socket.gameCode;
      console.log("Handling disconnect, gameCode", gameCode);
      if (gameCode && games[gameCode]) {
        const index = games[gameCode].players.indexOf(socket.username);
        if (index > -1) {
          socket.leave(gameCode);
          io.to(gameCode).emit("gameOver", "Other user disconnected");
          delete games[gameCode];
          console.log("Player left game ", gameCode);
        } else {
          console.log(
            "Player id",
            socket.id,
            "attempted to leave game they were not in ",
            gameCode
          );
        }
      }
    });

    socket.on("gameboard", () => {
      // Send full game board on request
      let gameCode = socket.gameCode;
      socket.emit(
        "board",
        games[gameCode].board.boardState,
        games[gameCode].board.currentPlayer
      );
    });

    socket.on("makemove", async (msg) => {
      let gameCode = socket.gameCode;
      if (!games[gameCode]) {
        console.log("Invalid game code:", gameCode);
        return;
      }
      console.log("got makemove", msg);
      // When sent a move, update the board and send new board accordingly
      const token = tokenAt(games[gameCode].board, msg.oldRow, msg.oldCol);
      if (token) {
        games[gameCode].board = makeMove(games[gameCode].board, token, [
          msg.newRow,
          msg.newCol,
        ]);
      } else {
        console.log("Move selected an invalid piece");
      }

      console.log(
        "Sending board for game ",
        gameCode,
        "only move ",
        games[gameCode].board.onlyMove
      );
      io.to(gameCode).emit(
        "board",
        games[gameCode].board.boardState,
        games[gameCode].board.currentPlayer,
        games[gameCode].board.onlyMove
      );

      if (games[gameCode].board.winner) {
        const result = games[gameCode].board.winner;

        if (result === "draw") {
          declareDrawCon(gameCode);
          io.to(gameCode).emit("gameOver", "Game Over: It's a draw!");
        } else {
          const winner = socket.username;
          const loser = games[gameCode].players.find(
            (player) => player !== winner
          );

          declareWinnerCon(gameCode, playersAddr[winner]);
          socket.emit("gameOver", "You win!");
          socket.to(gameCode).emit("gameOver", "You lose!");
        }

        delete games[gameCode];
      }

      // OR, for lazy impl
      // io.to(gameCode).emit(msg)
    });
  });
}
