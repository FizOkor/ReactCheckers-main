//persistant memory

import { allPlayerMoves } from "./GameController.js";

let TOKEN_ID_COUNTER = 0;

// Tokens store their own position, title, and color
export class Token {
    index;
    isMonarch;
    color;
    id;

    constructor(index, isMonarch, color) {
        this.index = index;
        this.isMonarch = isMonarch;
        this.color = color;
        this.id = TOKEN_ID_COUNTER++; // Unique ID
    }

    copy = function () {
        const newToken = new Token(this.index, this.isMonarch, this.color);
        newToken.id = this.id; // preserve ID when copying
        return newToken;
    }

    softCopy = function (newIndex) {
        const newToken = new Token(newIndex, this.isMonarch, this.color);
        newToken.id = this.id;
        return newToken;
    }

    imgSource = function () {
        if (this.color == "b") {
            return this.isMonarch ? "dark_monarch.png" : "dark_piece.png";
        } else {
            return this.isMonarch ? "light_monarch.png" : "light_piece.png";
        }
    }
}

const redToken = new Token(0, false, "r")
const blackToken = new Token(0, false, "b")


export class Board {
    boardState;
    selected;
    currentPlayer;
    turnCount;
    winner;
    onlyMove;
    hasCapture;
    captureMoves;

    constructor(gameCode) {
        this.boardState = [];
        this.selected = null;
        this.currentPlayer = "b";
        this.turnCount = 0;
        this.winner = null;
        this.onlyMove = null;
        this.hasCapture = false;
        this.captureMoves = [];
        if (gameCode && gameCode == 69420)
            this.winBoard();
        else this.resetBoard();
    };

    copy() {
        let newBoard = new Board();
        newBoard.hasCapture = this.hasCapture;
        newBoard.captureMoves = this.captureMoves;  
        newBoard.boardState = this.boardState;
        newBoard.currentPlayer = this.currentPlayer;
        newBoard.turnCount = this.turnCount;
        newBoard.winner = this.winner;
        // Will be set to a token if that token is the only one that is allowed to move (during chain)
        newBoard.onlyMove = this.onlyMove;
        return newBoard;
    }

    resetBoard() {
        this.boardState = [];
        for (var i = 0; i < 32; i++) {
            if (i < 12) {
                this.boardState.push(redToken.softCopy(i));
            }
            else if (i >= 20) {
                this.boardState.push(blackToken.softCopy(i));
            }
            // else if (i == 16){
            //     this.boardState.push(new Token(16, true, "b"))
            // }
            // else if (i == 17){
            //     this.boardState.push(new Token(17, true, "b"))
            // }
            else {
                this.boardState.push(null);
            }
        }
    };

    winBoard() {
        this.boardState = [];
        const numbers = [4, 5, 6, 12, 13, 14, 20, 21, 22]
        for (var i = 0; i < 32; i++) {
            if (numbers.indexOf(i) != -1) {
                this.boardState.push(redToken.softCopy(i));
            } else if (i === 24) {
                this.boardState.push(blackToken.softCopy(i));
            }
            else {
                this.boardState.push(null);
            }
        }
    };

    iterateTurn() {
        // Swap turn
        const nextPlayer = this.currentPlayer == "r" ? "b" : "r";
        this.currentPlayer = nextPlayer;

        // Check win condition
        const playerMoves = allPlayerMoves(this);
        if (playerMoves.length == 0) {
            console.log("Game over, winner is", this.currentPlayer == "r" ? "b" : "r");
            this.winner = this.currentPlayer == "r" ? "b" : "r";
        }
        // console.log("Current Player:", this.currentPlayer);

        this.turnCount = this.turnCount + 1;
    }
};
