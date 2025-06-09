import { Token, Board } from "./GameModel.js"

//game logic

// endOfBoard() function, check if a token will turn into a monarch (call this function in makeMove())
const endOfBoard = function (token, newPosition) {
    if (token.color == "r" && newPosition[0] == 7) {
        return true;
    }
    else if (token.color == "b" && newPosition[0] == 0) {
        return true;
    }
    else {
        return false;
    }
}

// makeMove() function
export const makeMove = function (board, token, newPosition) {
    let legalMove = false;

    // If you move the only token you're allowed to move, you're back to being able to move anything
    if (board.onlyMove == token) board.onlyMove = null;

    const moveOptions = availableMoves(board, token);
    // Check if current row/col exists within the valid move list for the selected token
    for (const validMove of moveOptions) {
        if (newPosition[0] == validMove[0] && newPosition[1] == validMove[1]) {
            legalMove = true;
        }
    }

    if (!legalMove) {
        console.log("Attempted to make move but it was not legal!");
        return board;
    }

    const tokenPosition = indexToPosition(token.index);
    console.log("Moving token from ", tokenPosition, "to", newPosition);
    const dy = (newPosition[0] - tokenPosition[0]);
    const dx = (newPosition[1] - tokenPosition[1]);

    // Piece capture logic
    if (Math.abs(dy) == 2 && Math.abs(dx) == 2) {
        // If the piece wants to move by 2, it means a piece will be captured.
        console.log("Piece captured at", tokenPosition[0] + dy / 2, tokenPosition[1] + dx / 2,)
        board.boardState[positionToIndex(tokenPosition[0] + dy / 2, tokenPosition[1] + dx / 2)] = null;
    }

    if (endOfBoard(token, newPosition)) {
        token.isMonarch = true;
    }

    const newIndex = positionToIndex(newPosition[0], newPosition[1]);
    board.boardState[token.index] = null;
    token.index = newIndex;
    board.boardState[newIndex] = token;

    if (Math.abs(dy) == 2 && Math.abs(dx) == 2) {
        const moveOptions = availableMoves(board, token);
        console.log("moveOPtions ", moveOptions);
        // Check if current row/col exists within the valid move list for the selected token
        for (const validMove of moveOptions) {
            let newPosition = [validMove[0], validMove[1]]
            const tokenPosition = indexToPosition(token.index);
            console.log("Testing move from ", tokenPosition, "to", newPosition);
            const dy = (newPosition[0] - tokenPosition[0]);
            const dx = (newPosition[1] - tokenPosition[1]);
            // Don't swap turns if there's a next move that 
            if (Math.abs(dy) == 2 && Math.abs(dx) == 2) {
                board.onlyMove = token;
                return board;
            }
        }
    }



    board.iterateTurn();
    return board;
}


// availableMoves() function (for a single piece)
export const availableMoves = function (board, token) {
    const moves = []
    const position = indexToPosition(token.index);
    // console.log("Index:", token.index, "Position:", position)
    const x = position[1];
    const y = position[0];

    const xOptions = [-1, 1]
    const yOptions = []
    // Populate list of moves based on color + royalty status
    if (token.isMonarch) {
        yOptions.push(-1);
        yOptions.push(1);
    } else if (token.color == "b") {
        yOptions.push(-1);
    } else {
        yOptions.push(1);
    }
    // console.log("Available moves from", y, x, ":", String(xOptions), String(yOptions))
    // Loop through x and y movement options
    xOptions.forEach((dx) => {
        yOptions.forEach((dy) => {
            const target = tokenAt(board, y + dy, x + dx);

            if (inBounds(y + dy, x + dx) && tokenAt(board, y + dy, x + dx) == null) {
                // Only allow moves that don't capture if the piece is not restricted
                // This cannot go in the parent if because the else if should not trigger
                if (!board.onlyMove) {
                    moves.push([y + dy, x + dx]);
                }
            }
            else if (inBounds(y + 2 * dy, x + 2 * dx) && target?.color != board.currentPlayer && tokenAt(board, y + 2 * dy, x + 2 * dx) == null) {
                moves.push([y + 2 * dy, x + 2 * dx])
            }
        })
    })
    // console.log("Move options from selected piece:", moves)
    return moves
}

export const isLegalMove = function (board, selected, newPosition) {
    const tokenAtSelected = tokenAt(board, selected?.row, selected?.col);
    if (tokenAtSelected != null) {
        // Find available moves
        const moveOptions = availableMoves(board, tokenAtSelected);
        // console.log("Examining", row, col, "Move Options:",moveOptions)
        // Check if current row/col exists within the valid move list for the selected token
        for (const validMove of moveOptions) {
            if (newPosition[0] == validMove[0] && newPosition[1] == validMove[1]) {
                return true;
            }
        }
    }
    return false;
}

const inBounds = function (row, col) {
    const xInBounds = col >= 0 && col < 8;
    const yInBounds = row >= 0 && row < 8;
    return xInBounds && yInBounds;
}

// allPlayerMoves() function (every move a player can make)
export const allPlayerMoves = function (board) {
    let allMoves = [];
    for (const tokenIndex in board.boardState) {
        const token = board.boardState[tokenIndex]
        if (token == null) {
            continue;
        }
        if (token?.color == board.currentPlayer) {
            const singleTokenMoves = availableMoves(board, token);
            if (singleTokenMoves != undefined && singleTokenMoves.length > 0) {
                allMoves.push([token, availableMoves(board, token)]);
            }
        }
    }
    // console.log("Player", board.currentPlayer, "moves:", allMoves);
    return allMoves;
}

export const tokenAt = function (board, row, col) {
    const index = positionToIndex(row, col);
    return board.boardState[index];
};

export const indexToPosition = function (index) {
    // Plus 1 bc 1-based indexing
    const row = Math.floor(index / 4);
    // Every other line has an offset of 1
    const xOffset = (row) % 2;
    const col = (index % 4) * 2 + xOffset;

    return [row, col];
}

export const positionToIndex = function (row, col) {
    // Offset on even number rows (from top left)
    const xOffset = row % 2;
    const index = row * 4 + (col - xOffset) / 2;
    return index;
}