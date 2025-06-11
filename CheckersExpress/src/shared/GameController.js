//game logic

// endOfBoard() function, check if a token will turn into a monarch (call this function in makeMove())
const endOfBoard = function (token, newPosition) {
  if (token.color == "r" && newPosition[0] == 7) {
    return true;
  } else if (token.color == "b" && newPosition[0] == 0) {
    return true;
  } else {
    return false;
  }
};

// makeMove() function
export const makeMove = function (board, token, newPosition) {
  // Validate move
  const moveOptions = availableMoves(board, token);
  const isValid = moveOptions.some(
    (m) => m[0] === newPosition[0] && m[1] === newPosition[1]
  );
  if (!isValid) {
    console.log("Illegal move attempted");
    return board;
  }

  // Clear onlyMove if relevant
  if (board.onlyMove === token.id) board.onlyMove = null;

  const [oldY, oldX] = indexToPosition(token.index);
  const [newY, newX] = newPosition;
  const dy = newY - oldY;
  const dx = newX - oldX;
  const absDy = Math.abs(dy);
  const absDx = Math.abs(dx);

  let captured = false;

  // --- Handle captures ---
  if (absDy > 1 || absDx > 1) {
    const stepY = Math.sign(dy);
    const stepX = Math.sign(dx);

    if (token.isMonarch) {
      let currentY = oldY + stepY;
      let currentX = oldX + stepX;
      let hasCaptured = false;

      while (currentY !== newY || currentX !== newX) {
        const target = tokenAt(board, currentY, currentX);

        if (target) {
          if (target.color !== token.color && !hasCaptured) {
            board.boardState[positionToIndex(currentY, currentX)] = null;
            hasCaptured = true;
            captured = true;
          } else {
            // Cannot jump over multiple or own pieces
            break;
          }
        }

        currentY += stepY;
        currentX += stepX;
      }
    } else {
      // Regular piece capture
      const capY = oldY + dy / 2;
      const capX = oldX + dx / 2;
      const capturedToken = tokenAt(board, capY, capX);
      if (capturedToken && capturedToken.color !== token.color) {
        board.boardState[positionToIndex(capY, capX)] = null;
        captured = true;
      }
    }
  }

  // --- Move token ---
  const newIndex = positionToIndex(newY, newX);
  board.boardState[token.index] = null;
  token.index = newIndex;
  board.boardState[newIndex] = token;

  // --- Handle promotion ---
  const promoted = endOfBoard(token, newPosition);
  if (promoted) {
    token.isMonarch = true;
    board.onlyMove = null; // clear restriction
  }

  // --- Check for follow-up captures (for regular pieces or monarchs) ---
  // if (captured && !promoted) {
  //   const nextCaptureMoves = availableMoves(board, token).filter(([y, x]) => {
  //     const dy2 = y - newY;
  //     const dx2 = x - newX;
  //     return Math.abs(dy2) > 1 || Math.abs(dx2) > 1;
  //   });

  //   if (nextCaptureMoves.length > 0) {
  //     console.log('nextCaptureMoves:', nextCaptureMoves)
  //     board.onlyMove = token;
  //     board.boardState = board.copy().boardState;
  //     return board;
  //   }
  // }

  board.iterateTurn();
  return board;
};

// availableMoves() function (for a single piece)
export const availableMoves = function (board, token) {
  const captures = [];
  const moves = [];

  if (board.onlyMove && board.onlyMove !== token) return [];

  const [y, x] = indexToPosition(token.index);
  const directions = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];

  if (token.isMonarch) {
    for (const [dy, dx] of directions) {
      let n = 1;
      let captured = false;

      while (inBounds(y + dy * n, x + dx * n)) {
        const ny = y + dy * n;
        const nx = x + dx * n;
        const occupant = tokenAt(board, ny, nx);

        if (occupant) {
          if (occupant.color === token.color) {
            break; //  Own piece blocks further movement in this direction
          }

          if (captured) {
            break; //  Already jumped a piece, can't jump another
          }

          // Found first enemy, check if we can jump over
          const jumpY = ny + dy;
          const jumpX = nx + dx;

          if (inBounds(jumpY, jumpX) && !tokenAt(board, jumpY, jumpX)) {
            captured = true;
            n++; // Skip over the opponent
            continue;
          } else {
            break;
          }
        } else {
          if (!captured && !board.onlyMove) {
            moves.push([ny, nx]);
          } else if (captured) {
            captures.push([ny, nx]);
          }
        }

        n++;
      }
    }
  } else {
    const yDir = token.color === "b" ? -1 : 1;

    for (const dx of [-1, 1]) {
      const ny = y + yDir;
      const nx = x + dx;

      // Normal move
      if (inBounds(ny, nx) && !tokenAt(board, ny, nx) && !board.onlyMove) {
        moves.push([ny, nx]);
      }

      // Capture move
      const capY = y + 2 * yDir;
      const capX = x + 2 * dx;
      const middle = tokenAt(board, y + yDir, x + dx);

      if (
        inBounds(capY, capX) &&
        middle &&
        middle.color !== token.color &&
        !tokenAt(board, capY, capX)
      ) {
        captures.push([capY, capX]);
      }
    }
  }

  return captures.length > 0 ? captures : moves;
};

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
};

const inBounds = function (row, col) {
  const xInBounds = col >= 0 && col < 8;
  const yInBounds = row >= 0 && row < 8;
  return xInBounds && yInBounds;
};

// allPlayerMoves() function (every move a player can make)
export const allPlayerMoves = function (board) {
  let allMoves = [];
  let capturingMoves = [];

  for (const tokenIndex in board.boardState) {
    const token = board.boardState[tokenIndex];
    if (token && token.color == board.currentPlayer) {
      const moves = availableMoves(board, token);

      for (const move of moves) {
        const dy = move[0] - indexToPosition(token.index)[0];
        if (Math.abs(dy) == 2) capturingMoves.push([token, move]);
      }

      if (moves.length > 0) {
        allMoves.push([token, moves]);
      }
    }
  }

  board.hasCapture = capturingMoves.length > 0;
  board.captureMoves = capturingMoves;

  return allMoves;
};

export const tokenAt = function (board, row, col) {
  const index = positionToIndex(row, col);
  return board.boardState[index];
};
export const tokenAtRen = function (board, row, col) {
  return board.tokens.find((token) => {
    const [tRow, tCol] = indexToPosition(token.index);
    return tRow === row && tCol === col;
  });
};

export const indexToPosition = function (index) {
  // Plus 1 bc 1-based indexing
  const row = Math.floor(index / 4);
  // Every other line has an offset of 1
  const xOffset = row % 2;
  const col = (index % 4) * 2 + xOffset;

  return [row, col];
};

export const positionToIndex = function (row, col) {
  // Offset on even number rows (from top left)
  const xOffset = row % 2;
  const index = row * 4 + (col - xOffset) / 2;
  return index;
};
